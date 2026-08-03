import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { create } from "zustand";
import type { IJitsiMeetExternalApi } from "@jitsi/react-sdk/lib/types";
import { callDoc, callsCol } from "@/lib/firebase/firestore";
import { setCallStatus } from "@/lib/firebase/calls";
import { startRingtone, stopRingtone } from "@/lib/webrtc/ringtone";
import type { Call, CallStatus, CallType } from "@/types/call";

export type CallPhase = "idle" | "incoming" | "outgoing" | "active" | "ended";

interface CallStoreState {
  phase: CallPhase;
  jitsiApi: IJitsiMeetExternalApi | null;
  chatId: string | null;
  callId: string | null;
  jitsiRoomName: string | null;
  incomingCall: Call | null;
  peerId: string | null;
  callType: CallType | null;
  isGroup: boolean;
  /** Tracked live via Jitsi's participantJoined/participantLeft events — decides whether hanging up on a group call just leaves it or ends it for everyone. */
  otherParticipantCount: number;
  error: string | null;
  endedReason: CallStatus | null;
  callStartedAt: number | null;

  setIncomingCall: (call: Call | null) => void;
  setJitsiApi: (api: IJitsiMeetExternalApi) => void;
  startCall: (chatId: string, callerId: string, calleeId: string, type: CallType) => Promise<void>;
  startGroupCall: (chatId: string, starterId: string, memberIds: string[], type: CallType) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  declineIncomingCall: () => Promise<void>;
  endCall: () => Promise<void>;
  dismissEndedBanner: () => void;
}

const RINGING_TIMEOUT_MS = 45_000;
let ringTimeoutId: ReturnType<typeof setTimeout> | null = null;
let unsubscribeCallDoc: (() => void) | null = null;
/** Group calls a user explicitly declined — don't re-prompt them for the same still-active call. */
const dismissedGroupCallIds = new Set<string>();

function clearRingTimeout() {
  if (ringTimeoutId) {
    clearTimeout(ringTimeoutId);
    ringTimeoutId = null;
  }
}

function stopListeningToCallDoc() {
  if (unsubscribeCallDoc) {
    unsubscribeCallDoc();
    unsubscribeCallDoc = null;
  }
}

/** Random per-call room name on the public meet.jit.si server. The Firestore doc id (~119 bits of entropy) makes it practically unguessable — nobody can stumble into someone else's call. */
function roomNameForCall(callId: string) {
  return `chatly-call-${callId}`;
}

function resetMediaState() {
  return {
    jitsiApi: null,
    chatId: null,
    callId: null,
    jitsiRoomName: null,
    otherParticipantCount: 0,
    callStartedAt: null as number | null,
  };
}

export const useCallStore = create<CallStoreState>((set, get) => ({
  phase: "idle",
  jitsiApi: null,
  chatId: null,
  callId: null,
  jitsiRoomName: null,
  incomingCall: null,
  peerId: null,
  callType: null,
  isGroup: false,
  otherParticipantCount: 0,
  error: null,
  endedReason: null,
  callStartedAt: null,

  setIncomingCall: (call) => {
    const { phase } = get();
    if (call && phase !== "idle") return;
    if (call && call.isGroup && dismissedGroupCallIds.has(call.id)) return;
    set({ incomingCall: call, phase: call ? "incoming" : phase === "incoming" ? "idle" : phase });
    if (call) startRingtone();
    else stopRingtone();
  },

  setJitsiApi: (api) => {
    set({ jitsiApi: api });
    api.on("participantJoined", (ev) => {
      console.log("[Jitsi] participantJoined:", ev);
      set({ otherParticipantCount: get().otherParticipantCount + 1 });
    });
    api.on("participantLeft", (ev) => {
      console.log("[Jitsi] participantLeft:", ev);
      set({ otherParticipantCount: Math.max(0, get().otherParticipantCount - 1) });
    });
    api.on("videoConferenceJoined", (ev) => {
      console.log("[Jitsi] videoConferenceJoined:", ev);
      if (get().phase === "outgoing" || get().phase === "active") {
        set({ callStartedAt: get().callStartedAt ?? Date.now() });
      }
    });
    api.on("errorOccurred", (ev) => console.error("[Jitsi] errorOccurred:", ev));
    // The user hung up via Jitsi's own in-call toolbar button.
    api.on("readyToClose", () => {
      console.log("[Jitsi] readyToClose");
      void get().endCall();
    });
  },

  startCall: async (chatId, callerId, calleeId, type) => {
    set({ phase: "outgoing", peerId: calleeId, callType: type, isGroup: false, error: null });
    try {
      const ref = doc(callsCol(chatId));
      const jitsiRoomName = roomNameForCall(ref.id);
      set({ chatId, callId: ref.id, jitsiRoomName });

      await setDoc(ref, {
        id: "",
        chatId: "",
        callerId,
        isGroup: false,
        participantIds: [callerId, calleeId],
        type,
        status: "ringing",
        jitsiRoomName,
        createdAt: serverTimestamp(),
        answeredAt: null,
        endedAt: null,
      });

      unsubscribeCallDoc = onSnapshot(callDoc(chatId, ref.id), (snap) => {
        if (!snap.exists()) return;
        const call = snap.data();
        if (call.status === "active" && get().phase === "outgoing") {
          clearRingTimeout();
          set({ phase: "active" });
        }
        if (["ended", "declined", "missed"].includes(call.status) && get().phase !== "idle" && get().phase !== "ended") {
          clearRingTimeout();
          stopListeningToCallDoc();
          get().jitsiApi?.dispose();
          set({ ...resetMediaState(), phase: "ended", endedReason: call.status });
        }
      });

      clearRingTimeout();
      ringTimeoutId = setTimeout(() => {
        if (get().phase === "outgoing") {
          void setCallStatus(chatId, ref.id, "missed").catch(() => undefined);
          stopListeningToCallDoc();
          get().jitsiApi?.dispose();
          set({ ...resetMediaState(), phase: "ended", endedReason: "missed" });
        }
      }, RINGING_TIMEOUT_MS);
    } catch (err) {
      console.error("[Jitsi] startCall failed:", err);
      set({ phase: "ended", endedReason: "ended", error: "Qo'ng'iroqni boshlab bo'lmadi" });
    }
  },

  startGroupCall: async (chatId, starterId, memberIds, type) => {
    set({ phase: "active", peerId: null, callType: type, isGroup: true, error: null });
    try {
      const ref = doc(callsCol(chatId));
      const jitsiRoomName = roomNameForCall(ref.id);
      set({ chatId, callId: ref.id, jitsiRoomName });

      await setDoc(ref, {
        id: "",
        chatId: "",
        callerId: starterId,
        isGroup: true,
        participantIds: memberIds,
        type,
        status: "active",
        jitsiRoomName,
        createdAt: serverTimestamp(),
        answeredAt: serverTimestamp(),
        endedAt: null,
      });

      unsubscribeCallDoc = onSnapshot(callDoc(chatId, ref.id), (snap) => {
        if (!snap.exists()) return;
        const call = snap.data();
        if (["ended", "declined", "missed"].includes(call.status) && get().phase !== "idle" && get().phase !== "ended") {
          stopListeningToCallDoc();
          get().jitsiApi?.dispose();
          set({ ...resetMediaState(), phase: "ended", endedReason: call.status });
        }
      });
    } catch (err) {
      console.error("[Jitsi] startGroupCall failed:", err);
      set({ phase: "ended", endedReason: "ended", error: "Guruh qo'ng'irog'ini boshlab bo'lmadi" });
    }
  },

  acceptIncomingCall: async () => {
    const call = get().incomingCall;
    if (!call) return;
    stopRingtone();
    set({
      phase: "active",
      incomingCall: null,
      peerId: call.isGroup ? null : call.callerId,
      callType: call.type,
      isGroup: call.isGroup,
      error: null,
      chatId: call.chatId,
      callId: call.id,
      jitsiRoomName: call.jitsiRoomName,
    });

    if (!call.isGroup) {
      await setCallStatus(call.chatId, call.id, "active").catch(() => undefined);
    }

    unsubscribeCallDoc = onSnapshot(callDoc(call.chatId, call.id), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (["ended", "declined", "missed"].includes(data.status) && get().phase !== "idle" && get().phase !== "ended") {
        stopListeningToCallDoc();
        get().jitsiApi?.dispose();
        set({ ...resetMediaState(), phase: "ended", endedReason: data.status });
      }
    });
  },

  declineIncomingCall: async () => {
    const call = get().incomingCall;
    if (!call) return;
    stopRingtone();
    set({ incomingCall: null, phase: "idle" });
    if (call.isGroup) {
      dismissedGroupCallIds.add(call.id);
    } else {
      await setCallStatus(call.chatId, call.id, "declined").catch(() => undefined);
    }
  },

  endCall: async () => {
    const { jitsiApi, chatId, callId, isGroup, otherParticipantCount, phase } = get();
    if (phase === "idle" || phase === "ended") return;
    clearRingTimeout();
    stopRingtone();
    stopListeningToCallDoc();

    jitsiApi?.dispose();

    if (chatId && callId) {
      if (!(isGroup && otherParticipantCount > 0)) {
        await setCallStatus(chatId, callId, "ended").catch(() => undefined);
      }
    }

    set({ ...resetMediaState(), phase: "idle", peerId: null, callType: null, isGroup: false, incomingCall: null });
  },

  dismissEndedBanner: () => {
    set({ phase: "idle", endedReason: null, error: null, peerId: null, callType: null, isGroup: false });
  },
}));
