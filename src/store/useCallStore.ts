import { create } from "zustand";
import { CallSession } from "@/lib/webrtc/CallSession";
import { setCallStatus } from "@/lib/firebase/calls";
import { MediaAccessError } from "@/lib/webrtc/media";
import { startRingtone, stopRingtone } from "@/lib/webrtc/ringtone";
import type { Call, CallStatus, CallType } from "@/types/call";

export type CallPhase = "idle" | "incoming" | "outgoing" | "active" | "ended";

interface CallStoreState {
  phase: CallPhase;
  session: CallSession | null;
  incomingCall: Call | null;
  peerId: string | null;
  callType: CallType | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  muted: boolean;
  cameraOff: boolean;
  facingMode: "user" | "environment";
  connectionState: RTCPeerConnectionState | null;
  error: string | null;
  endedReason: CallStatus | null;
  callStartedAt: number | null;

  setIncomingCall: (call: Call | null) => void;
  startCall: (chatId: string, callerId: string, calleeId: string, type: CallType) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  declineIncomingCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
  switchCamera: () => Promise<void>;
  dismissEndedBanner: () => void;
}

const RINGING_TIMEOUT_MS = 45_000;
let ringTimeoutId: ReturnType<typeof setTimeout> | null = null;

function clearRingTimeout() {
  if (ringTimeoutId) {
    clearTimeout(ringTimeoutId);
    ringTimeoutId = null;
  }
}

function resetMediaState() {
  return {
    session: null,
    localStream: null,
    remoteStream: null,
    muted: false,
    cameraOff: false,
    connectionState: null as RTCPeerConnectionState | null,
    callStartedAt: null as number | null,
  };
}

export const useCallStore = create<CallStoreState>((set, get) => ({
  phase: "idle",
  session: null,
  incomingCall: null,
  peerId: null,
  callType: null,
  localStream: null,
  remoteStream: null,
  muted: false,
  cameraOff: false,
  facingMode: "user",
  connectionState: null,
  error: null,
  endedReason: null,
  callStartedAt: null,

  setIncomingCall: (call) => {
    const { phase } = get();
    // Don't interrupt an already-active/outgoing call with a second incoming one.
    if (call && phase !== "idle") return;
    set({ incomingCall: call, phase: call ? "incoming" : phase === "incoming" ? "idle" : phase });
    if (call) startRingtone();
    else stopRingtone();
  },

  startCall: async (chatId, callerId, calleeId, type) => {
    set({ phase: "outgoing", peerId: calleeId, callType: type, error: null });
    try {
      const session = await CallSession.startAsCaller(chatId, callerId, calleeId, type, {
        onRemoteStream: (stream) => set({ remoteStream: stream }),
        onConnectionStateChange: (state) => set({ connectionState: state }),
        onStatusChange: (status) => {
          if (status === "active" && get().phase === "outgoing") {
            clearRingTimeout();
            set({ phase: "active", callStartedAt: Date.now() });
          }
        },
        onRemoteEnded: (status) => {
          clearRingTimeout();
          get().session?.teardownLocal();
          set({ ...resetMediaState(), phase: "ended", endedReason: status });
        },
      });
      set({ session, localStream: session.localStream });

      clearRingTimeout();
      ringTimeoutId = setTimeout(() => {
        if (get().phase === "outgoing") {
          void get().session?.end("missed");
          set({ ...resetMediaState(), phase: "ended", endedReason: "missed" });
        }
      }, RINGING_TIMEOUT_MS);
    } catch (err) {
      set({
        phase: "ended",
        endedReason: "ended",
        error: err instanceof MediaAccessError ? err.message : "Qo'ng'iroqni boshlab bo'lmadi",
      });
    }
  },

  acceptIncomingCall: async () => {
    const call = get().incomingCall;
    if (!call) return;
    stopRingtone();
    set({ phase: "active", incomingCall: null, peerId: call.callerId, callType: call.type, error: null, callStartedAt: Date.now() });
    try {
      const session = await CallSession.startAsCallee(call, {
        onRemoteStream: (stream) => set({ remoteStream: stream }),
        onConnectionStateChange: (state) => set({ connectionState: state }),
        onStatusChange: () => undefined,
        onRemoteEnded: (status) => {
          get().session?.teardownLocal();
          set({ ...resetMediaState(), phase: "ended", endedReason: status });
        },
      });
      set({ session, localStream: session.localStream });
    } catch (err) {
      await setCallStatus(call.chatId, call.id, "declined").catch(() => undefined);
      set({
        ...resetMediaState(),
        phase: "ended",
        endedReason: "declined",
        error: err instanceof MediaAccessError ? err.message : "Qo'ng'iroqqa ulanib bo'lmadi",
      });
    }
  },

  declineIncomingCall: async () => {
    const call = get().incomingCall;
    if (!call) return;
    stopRingtone();
    set({ incomingCall: null, phase: "idle" });
    await setCallStatus(call.chatId, call.id, "declined").catch(() => undefined);
  },

  endCall: async () => {
    const { session } = get();
    clearRingTimeout();
    stopRingtone();
    if (session) await session.end("ended");
    set({ ...resetMediaState(), phase: "idle", peerId: null, callType: null, incomingCall: null });
  },

  toggleMute: () => {
    const { session } = get();
    if (!session) return;
    set({ muted: session.toggleMute() });
  },

  toggleCamera: () => {
    const { session } = get();
    if (!session) return;
    set({ cameraOff: session.toggleCamera() });
  },

  switchCamera: async () => {
    const { session, facingMode } = get();
    if (!session) return;
    const next = await session.switchCamera(facingMode);
    set({ facingMode: next });
  },

  dismissEndedBanner: () => {
    set({ phase: "idle", endedReason: null, error: null, peerId: null, callType: null });
  },
}));
