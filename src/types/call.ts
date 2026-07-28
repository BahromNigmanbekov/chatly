import type { Timestamp } from "firebase/firestore";

export type CallType = "audio" | "video";
export type CallStatus = "ringing" | "active" | "ended" | "declined" | "missed";

export interface CallSessionDescription {
  sdp: string;
  type: RTCSdpType;
}

export interface Call {
  id: string;
  chatId: string;
  callerId: string;
  calleeId: string;
  participantIds: string[];
  type: CallType;
  status: CallStatus;
  offer: CallSessionDescription | null;
  answer: CallSessionDescription | null;
  createdAt: Timestamp | null;
  answeredAt: Timestamp | null;
  endedAt: Timestamp | null;
}

export interface CallIceCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  createdAt: Timestamp | null;
}
