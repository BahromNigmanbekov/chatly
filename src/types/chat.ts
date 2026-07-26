import type { Timestamp } from "firebase/firestore";
import type { MessageType } from "./message";

export type ChatType = "direct" | "group";

export interface TypingEntry {
  type: "text" | "voice";
  updatedAt: Timestamp;
}

export interface LastMessagePreview {
  text: string;
  senderId: string;
  timestamp: Timestamp | null;
  type: MessageType;
}

export interface Chat {
  id: string;
  type: ChatType;
  participantIds: string[];
  groupName: string | null;
  groupPhotoURL: string | null;
  adminIds: string[];
  ownerId: string | null;
  onlyAdminsCanPost: boolean;
  lastMessage: LastMessagePreview | null;
  typingStatus: Record<string, TypingEntry>;
  unreadCounts: Record<string, number>;
  createdAt: Timestamp | null;
}
