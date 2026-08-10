import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { create } from "zustand";
import { callDoc, callsCol } from "@/lib/firebase/firestore";
import { setCallStatus } from "@/lib/firebase/calls";
import { fetchLiveKitToken } from "@/lib/livekit/token";
import { startRingtone, stopRingtone } from "@/lib/webrtc/ringtone";
import { useAuthStore } from "@/store/useAuthStore";
import type { Call, CallStatus, CallType } from "@/types/call";

export type CallPhase = "idle" | "incoming" | "outgoing" | "active" | "ended";

interface CallStoreState {
  phase: CallPhase;
  chatId: string | null;
  callId: string | null;
  roomName: string | null;
  livekitToken: string | null;
  incomingCall: Call | null;
  peerId: string | null;
  callType: CallType | null;
  isGroup: boolean;
  /** Tracked live from inside <LiveKitRoom> (see ActiveCallScreen) — decides whether hanging up on a group call just leaves it or ends it for everyone. */
  otherParticipantCount: number;
  error: string | null;
  endedReason: CallStatus | null;
  callStartedAt: number | null;

  setIncomingCall: (call: Call | null) => void;
  setOtherParticipantCount: (count: number) => void;
  markConnected: () => void;
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

/** Random per-call room name. Access is gated by a per-user server-minted JWT (see api/livekit-token), not by this being secret. */
function roomNameForCall(callId: string) {
  return `chatly-call-${callId}`;
}

function myIdentity(): { uid: string; name: string } | null {
  const { firebaseUser, profile } = useAuthStore.getState();
  if (!firebaseUser) return null;
  return { uid: firebaseUser.uid, name: profile?.displayName ?? "Foydalanuvchi" };
}

function resetMediaState() {
  return {
    chatId: null,
    callId: null,
    roomName: null,
    livekitToken: null,
    otherParticipantCount: 0,
    callStartedAt: null as number | null,
  };
}

export const useCallStore = create<CallStoreState>((set, get) => ({
  phase: "idle",
  chatId: null,
  callId: null,
  roomName: null,
  livekitToken: null,
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

  setOtherParticipantCount: (count) => set({ otherParticipantCount: count }),

  markConnected: () => {
    if (!get().callStartedAt) set({ callStartedAt: Date.now() });
  },

  startCall: async (chatId, callerId, calleeId, type) => {
    set({ phase: "outgoing", peerId: calleeId, callType: type, isGroup: false, error: null });
    try {
      const me = myIdentity();
      if (!me) throw new Error("not signed in");
      const ref = doc(callsCol(chatId));
      const roomName = roomNameForCall(ref.id);
      const token = await fetchLiveKitToken(roomName, callerId, me.name);
      set({ chatId, callId: ref.id, roomName, livekitToken: token });

      await setDoc(ref, {
        id: "",
        chatId: "",
        callerId,
        isGroup: false,
        participantIds: [callerId, calleeId],
        type,
        status: "ringing",
        roomName,
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
          set({ ...resetMediaState(), phase: "ended", endedReason: call.status });
        }
      });

      clearRingTimeout();
      ringTimeoutId = setTimeout(() => {
        if (get().phase === "outgoing") {
          void setCallStatus(chatId, ref.id, "missed").catch(() => undefined);
          stopListeningToCallDoc();
          set({ ...resetMediaState(), phase: "ended", endedReason: "missed" });
        }
      }, RINGING_TIMEOUT_MS);
    } catch (err) {
      console.error("[LiveKit] startCall failed:", err);
      set({ phase: "ended", endedReason: "ended", error: "Qo'ng'iroqni boshlab bo'lmadi" });
    }
  },

  startGroupCall: async (chatId, starterId, memberIds, type) => {
    set({ phase: "active", peerId: null, callType: type, isGroup: true, error: null });
    try {
      const me = myIdentity();
      if (!me) throw new Error("not signed in");
      const ref = doc(callsCol(chatId));
      const roomName = roomNameForCall(ref.id);
      const token = await fetchLiveKitToken(roomName, starterId, me.name);
      set({ chatId, callId: ref.id, roomName, livekitToken: token });

      await setDoc(ref, {
        id: "",
        chatId: "",
        callerId: starterId,
        isGroup: true,
        participantIds: memberIds,
        type,
        status: "active",
        roomName,
        createdAt: serverTimestamp(),
        answeredAt: serverTimestamp(),
        endedAt: null,
      });

      unsubscribeCallDoc = onSnapshot(callDoc(chatId, ref.id), (snap) => {
        if (!snap.exists()) return;
        const call = snap.data();
        if (["ended", "declined", "missed"].includes(call.status) && get().phase !== "idle" && get().phase !== "ended") {
          stopListeningToCallDoc();
          set({ ...resetMediaState(), phase: "ended", endedReason: call.status });
        }
      });
    } catch (err) {
      console.error("[LiveKit] startGroupCall failed:", err);
      set({ phase: "ended", endedReason: "ended", error: "Guruh qo'ng'irog'ini boshlab bo'lmadi" });
    }
  },

  acceptIncomingCall: async () => {
    const call = get().incomingCall;
    const me = myIdentity();
    if (!call || !me) return;
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
      roomName: call.roomName,
      livekitToken: null,
    });

    try {
      const token = await fetchLiveKitToken(call.roomName, me.uid, me.name);
      set({ livekitToken: token });
    } catch (err) {
      console.error("[LiveKit] token fetch failed on accept:", err);
      set({ ...resetMediaState(), phase: "ended", endedReason: "declined", error: "Qo'ng'iroqqa ulanib bo'lmadi" });
      return;
    }

    if (!call.isGroup) {
      await setCallStatus(call.chatId, call.id, "active").catch(() => undefined);
    }

    unsubscribeCallDoc = onSnapshot(callDoc(call.chatId, call.id), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (["ended", "declined", "missed"].includes(data.status) && get().phase !== "idle" && get().phase !== "ended") {
        stopListeningToCallDoc();
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
    const { chatId, callId, isGroup, otherParticipantCount, phase } = get();
    if (phase === "idle" || phase === "ended") return;
    clearRingTimeout();
    stopRingtone();
    stopListeningToCallDoc();

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
