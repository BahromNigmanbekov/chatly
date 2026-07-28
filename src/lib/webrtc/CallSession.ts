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

    for (const track of localStream.getTracks()) this.pc.addTrack(track, localStream);

    const remoteStream = new MediaStream();
    this.pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
      this.callbacks.onRemoteStream(remoteStream);
    };
    this.pc.onconnectionstatechange = () => {
      this.callbacks.onConnectionStateChange(this.pc.connectionState);
    };
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

      if (this.role === "caller" && call.answer && !this.remoteDescriptionSet) {
        void this.applyRemoteDescription(call.answer);
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
    const answer = await session.pc.createAnswer();
    await session.pc.setLocalDescription(answer);
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
    this.unsubscribers.forEach((u) => u());
    this.localStream.getTracks().forEach((t) => t.stop());
    this.pc.close();
  }
}
