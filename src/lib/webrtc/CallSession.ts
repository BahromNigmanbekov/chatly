import { addDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { callDoc, callerCandidatesCol, calleeCandidatesCol, callsCol } from "@/lib/firebase/firestore";
import { cleanupCallCandidates, setCallStatus } from "@/lib/firebase/calls";
import { getIceServers } from "@/lib/webrtc/iceServers";
import { getLocalMedia } from "@/lib/webrtc/media";
import type { Call, CallStatus, CallType } from "@/types/call";

interface CallSessionCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  /** Fires on every call-doc status change, including non-terminal ones (e.g. "active" once answered). */
  onStatusChange: (status: CallStatus) => void;
  /** Fires once when the other side ends/declines the call (a terminal status seen for the first time). */
  onRemoteEnded: (status: CallStatus) => void;
}

export type CallRole = "caller" | "callee";

/** Video is capped low (see media.ts constraints) — keep the sender's target bitrate in step so a slow/4G leg isn't asked to push more than it can. */
const MAX_VIDEO_BITRATE_BPS = 400_000;

/** ICE state must stay "disconnected"/"failed" for this long before we attempt a restart — avoids restarting on a momentary blip. */
const ICE_RESTART_GRACE_MS = 3_000;

async function capVideoBitrate(sender: RTCRtpSender) {
  try {
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
    params.encodings[0].maxBitrate = MAX_VIDEO_BITRATE_BPS;
    await sender.setParameters(params);
    console.log("[WebRTC] capped video sender bitrate to", MAX_VIDEO_BITRATE_BPS, "bps");
  } catch (err) {
    console.error("[WebRTC] failed to cap video bitrate", err);
  }
}

/** Owns one call's RTCPeerConnection + its Firestore signaling listeners, from setup through teardown. */
export class CallSession {
  readonly chatId: string;
  readonly callId: string;
  readonly role: CallRole;
  readonly type: CallType;
  readonly pc: RTCPeerConnection;
  localStream: MediaStream;

  private callbacks: CallSessionCallbacks;
  private unsubscribers: Array<() => void> = [];
  private remoteDescriptionSet = false;
  private pendingRemoteCandidates: RTCIceCandidateInit[] = [];
  private ended = false;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Guards against the automatic onnegotiationneeded firing that happens the
   * moment addTrack() runs in this constructor — that initial event is
   * already handled by startAsCaller()'s explicit createOffer() call, so
   * renegotiation (offer #2+, i.e. an ICE restart) must stay disabled until
   * the first offer/answer handshake has actually completed.
   */
  private renegotiationReady = false;
  private lastAppliedOfferSdp: string | null = null;
  private lastAppliedAnswerSdp: string | null = null;

  private constructor(
    chatId: string,
    callId: string,
    role: CallRole,
    type: CallType,
    localStream: MediaStream,
    callbacks: CallSessionCallbacks,
  ) {
    this.chatId = chatId;
    this.callId = callId;
    this.role = role;
    this.type = type;
    this.localStream = localStream;
    this.callbacks = callbacks;
    this.pc = new RTCPeerConnection({ iceServers: getIceServers() });

    for (const track of localStream.getTracks()) {
      const sender = this.pc.addTrack(track, localStream);
      console.log("[WebRTC]", role, "addTrack", track.kind);
      if (track.kind === "video") void capVideoBitrate(sender);
    }

    const remoteStream = new MediaStream();
    this.pc.ontrack = (e) => {
      console.log("[WebRTC]", role, "ontrack fired:", e.track.kind, "streams:", e.streams.length);
      e.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
      console.log("[WebRTC]", role, "remoteStream now has tracks:", remoteStream.getTracks().map((t) => t.kind));
      this.callbacks.onRemoteStream(remoteStream);
    };
    this.pc.onconnectionstatechange = () => {
      console.log("[WebRTC]", role, "connectionState ->", this.pc.connectionState);
      this.callbacks.onConnectionStateChange(this.pc.connectionState);
    };
    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc.iceConnectionState;
      console.log("[WebRTC]", role, "iceConnectionState ->", state);

      if (state === "disconnected" || state === "failed") {
        // Only the offering side (caller) actually restarts — see onnegotiationneeded below.
        if (!this.disconnectTimer && this.role === "caller") {
          this.disconnectTimer = setTimeout(() => {
            this.disconnectTimer = null;
            const current = this.pc.iceConnectionState;
            if (current === "disconnected" || current === "failed") {
              console.log("[WebRTC] caller: ICE stuck in", current, "— restarting");
              this.pc.restartIce();
            }
          }, ICE_RESTART_GRACE_MS);
        }
      } else {
        if (this.disconnectTimer) {
          clearTimeout(this.disconnectTimer);
          this.disconnectTimer = null;
        }
        if (state === "connected" || state === "completed") {
          void this.logSelectedCandidatePair();
        }
      }
    };
    this.pc.onicegatheringstatechange = () => {
      console.log("[WebRTC]", role, "iceGatheringState ->", this.pc.iceGatheringState);
    };
    this.pc.onnegotiationneeded = () => {
      if (this.role === "caller" && this.renegotiationReady) {
        console.log("[WebRTC] caller: negotiationneeded — renegotiating (ICE restart)");
        void this.renegotiateAsCaller();
      }
    };
  }

  /** Logs which candidate type (host/srflx/relay) the active connection settled on — the key signal for "are we stuck relaying through TURN". */
  private async logSelectedCandidatePair() {
    try {
      const stats = await this.pc.getStats();
      let localType: string | undefined;
      let remoteType: string | undefined;
      stats.forEach((report) => {
        if (report.type === "candidate-pair" && report.state === "succeeded" && report.nominated !== false) {
          const local = stats.get(report.localCandidateId);
          const remote = stats.get(report.remoteCandidateId);
          if (local) localType = local.candidateType;
          if (remote) remoteType = remote.candidateType;
        }
      });
      console.log(
        "[WebRTC]",
        this.role,
        "active candidate pair — local:",
        localType ?? "unknown",
        "remote:",
        remoteType ?? "unknown",
      );
    } catch (err) {
      console.error("[WebRTC] getStats failed", err);
    }
  }

  /** Caller side of an ICE restart: create+send a fresh offer over the same call doc. */
  private async renegotiateAsCaller() {
    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      await updateDoc(callDoc(this.chatId, this.callId), {
        offer: { sdp: offer.sdp ?? "", type: offer.type },
      });
      console.log("[WebRTC] caller: sent renegotiation offer");
    } catch (err) {
      console.error("[WebRTC] caller: renegotiation offer failed", err);
    }
  }

  /** Callee side of an ICE restart: the call doc's offer changed after the initial handshake — answer it again. */
  private async respondToRenegotiation(offer: RTCSessionDescriptionInit) {
    try {
      this.lastAppliedOfferSdp = offer.sdp ?? null;
      await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.lastAppliedAnswerSdp = answer.sdp ?? null;
      await updateDoc(callDoc(this.chatId, this.callId), {
        answer: { sdp: answer.sdp ?? "", type: answer.type },
      });
      console.log("[WebRTC] callee: answered renegotiation offer");
    } catch (err) {
      console.error("[WebRTC] callee: renegotiation answer failed", err);
    }
  }

  ownCandidatesCol() {
    return this.role === "caller"
      ? callerCandidatesCol(this.chatId, this.callId)
      : calleeCandidatesCol(this.chatId, this.callId);
  }

  private remoteCandidatesCol() {
    return this.role === "caller"
      ? calleeCandidatesCol(this.chatId, this.callId)
      : callerCandidatesCol(this.chatId, this.callId);
  }

  private listenForRemoteCandidates() {
    const unsub = onSnapshot(this.remoteCandidatesCol(), (snap) => {
      for (const change of snap.docChanges()) {
        if (change.type !== "added") continue;
        const data = change.doc.data();
        const init: RTCIceCandidateInit = {
          candidate: data.candidate,
          sdpMid: data.sdpMid,
          sdpMLineIndex: data.sdpMLineIndex,
        };
        if (this.remoteDescriptionSet) {
          void this.pc.addIceCandidate(new RTCIceCandidate(init));
        } else {
          this.pendingRemoteCandidates.push(init);
        }
      }
    });
    this.unsubscribers.push(unsub);
  }

  private async applyRemoteDescription(desc: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(desc));
    this.remoteDescriptionSet = true;
    for (const candidate of this.pendingRemoteCandidates.splice(0)) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  private publishOwnCandidates() {
    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        void addDoc(this.ownCandidatesCol(), {
          candidate: e.candidate.candidate,
          sdpMid: e.candidate.sdpMid,
          sdpMLineIndex: e.candidate.sdpMLineIndex,
          createdAt: serverTimestamp(),
        });
      }
    };
  }

  private listenForCallDoc() {
    const unsub = onSnapshot(callDoc(this.chatId, this.callId), (snap) => {
      if (!snap.exists()) return;
      const call = snap.data();

      if (this.role === "caller") {
        // Covers both the initial answer (lastAppliedAnswerSdp starts null)
        // and a later re-answer after an ICE-restart renegotiation.
        if (call.answer && call.answer.sdp !== this.lastAppliedAnswerSdp) {
          this.lastAppliedAnswerSdp = call.answer.sdp;
          void this.applyRemoteDescription(call.answer);
        }
      } else if (this.remoteDescriptionSet && call.offer && call.offer.sdp !== this.lastAppliedOfferSdp) {
        // remoteDescriptionSet gates this so the initial offer (applied
        // directly by startAsCallee, before this listener's first snapshot
        // even fires) isn't answered a second time here.
        void this.respondToRenegotiation(call.offer);
      }

      this.callbacks.onStatusChange(call.status);

      if (["ended", "declined", "missed"].includes(call.status) && !this.ended) {
        this.ended = true;
        this.callbacks.onRemoteEnded(call.status);
      }
    });
    this.unsubscribers.push(unsub);
  }

  /**
   * The call doc is only created (visible to the callee's "am I being called"
   * listener) once the offer is ready — creating it earlier with a null offer
   * would let a fast callee try to answer before the offer exists.
   */
  static async startAsCaller(
    chatId: string,
    callerId: string,
    calleeId: string,
    type: CallType,
    callbacks: CallSessionCallbacks,
  ): Promise<CallSession> {
    const stream = await getLocalMedia(type);
    const ref = doc(callsCol(chatId)); // reserves an ID; no write yet
    const session = new CallSession(chatId, ref.id, "caller", type, stream, callbacks);

    // Candidates can start gathering as soon as setLocalDescription runs, but
    // the call doc (and thus the rules-required call data) doesn't exist yet
    // — queue them locally and flush once the doc is written.
    const preDocCandidates: RTCIceCandidate[] = [];
    session.pc.onicecandidate = (e) => {
      if (e.candidate) preDocCandidates.push(e.candidate);
    };

    const offer = await session.pc.createOffer();
    await session.pc.setLocalDescription(offer);

    await setDoc(ref, {
      id: "",
      chatId: "",
      callerId,
      calleeId,
      participantIds: [callerId, calleeId],
      type,
      status: "ringing",
      offer: { sdp: offer.sdp ?? "", type: offer.type },
      answer: null,
      createdAt: serverTimestamp(),
      answeredAt: null,
      endedAt: null,
    });

    session.publishOwnCandidates();
    for (const candidate of preDocCandidates.splice(0)) {
      void addDoc(session.ownCandidatesCol(), {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        createdAt: serverTimestamp(),
      });
    }

    session.listenForRemoteCandidates();
    session.listenForCallDoc();
    // Only now — renegotiation (ICE restart) must never fire off the
    // automatic onnegotiationneeded that addTrack() triggered in the
    // constructor, which this method's own createOffer()/setLocalDescription()
    // call above already handles.
    session.renegotiationReady = true;

    return session;
  }

  static async startAsCallee(call: Call, callbacks: CallSessionCallbacks): Promise<CallSession> {
    const stream = await getLocalMedia(call.type);
    const session = new CallSession(call.chatId, call.id, "callee", call.type, stream, callbacks);
    session.publishOwnCandidates();
    session.listenForRemoteCandidates();
    session.listenForCallDoc();

    if (!call.offer) throw new Error("Call has no offer to answer");
    await session.applyRemoteDescription(call.offer);
    session.lastAppliedOfferSdp = call.offer.sdp ?? null;
    const answer = await session.pc.createAnswer();
    await session.pc.setLocalDescription(answer);
    session.lastAppliedAnswerSdp = answer.sdp ?? null;
    await updateDoc(callDoc(call.chatId, call.id), {
      answer: { sdp: answer.sdp ?? "", type: answer.type },
      status: "active",
      answeredAt: serverTimestamp(),
    });

    return session;
  }

  toggleMute(): boolean {
    const tracks = this.localStream.getAudioTracks();
    const nextEnabled = !(tracks[0]?.enabled ?? true);
    tracks.forEach((t) => (t.enabled = nextEnabled));
    return !nextEnabled; // returns "muted" state
  }

  toggleCamera(): boolean {
    const tracks = this.localStream.getVideoTracks();
    const nextEnabled = !(tracks[0]?.enabled ?? true);
    tracks.forEach((t) => (t.enabled = nextEnabled));
    return !nextEnabled; // returns "camera off" state
  }

  async switchCamera(currentFacingMode: "user" | "environment"): Promise<"user" | "environment"> {
    const nextFacingMode = currentFacingMode === "user" ? "environment" : "user";
    const newStream = await getLocalMedia(this.type, nextFacingMode);
    const newVideoTrack = newStream.getVideoTracks()[0];
    if (!newVideoTrack) return currentFacingMode;

    const sender = this.pc.getSenders().find((s) => s.track?.kind === "video");
    await sender?.replaceTrack(newVideoTrack);

    const oldVideoTrack = this.localStream.getVideoTracks()[0];
    oldVideoTrack?.stop();
    this.localStream.removeTrack(oldVideoTrack);
    this.localStream.addTrack(newVideoTrack);
    newStream.getAudioTracks().forEach((t) => t.stop()); // keep the original mic track

    return nextFacingMode;
  }

  /** Ends the call: writes the final status (only if the call is still ours to end), tears down media/PC, and clears signaling data. */
  async end(finalStatus: CallStatus = "ended") {
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }
    if (!this.ended) {
      this.ended = true;
      await setCallStatus(this.chatId, this.callId, finalStatus).catch(() => undefined);
    }
    this.unsubscribers.forEach((u) => u());
    this.localStream.getTracks().forEach((t) => t.stop());
    this.pc.close();
    await cleanupCallCandidates(this.chatId, this.callId).catch(() => undefined);
  }

  /** Called when the *other* side already ended the call — just tear down locally, no Firestore write needed. */
  teardownLocal() {
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }
    this.unsubscribers.forEach((u) => u());
    this.localStream.getTracks().forEach((t) => t.stop());
    this.pc.close();
  }
}
