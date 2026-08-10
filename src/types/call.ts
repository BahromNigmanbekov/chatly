import type { Timestamp } from "firebase/firestore";

export type CallType = "audio" | "video";
export type CallStatus = "ringing" | "active" | "ended" | "declined" | "missed";

export interface Call {
  id: string;
  chatId: string;
  callerId: string;
  /** True for group-chat calls (any online member may join anytime while active); false for a 1:1 call with a single target. */
  isGroup: boolean;
  /** Who was invited to this call at creation time — the callee for a 1:1 call, or the whole chat's membership for a group call. Not a live "who's currently in the room" list; LiveKit itself is the source of truth for that. */
  participantIds: string[];
  type: CallType;
  status: CallStatus;
  /** LiveKit room name — unique per call (see roomNameForCall() in useCallStore.ts). Access is gated by a per-user, server-minted JWT (src/app/api/livekit-token), not by the name being secret. */
  roomName: string;
  createdAt: Timestamp | null;
  answeredAt: Timestamp | null;
  endedAt: Timestamp | null;
}
