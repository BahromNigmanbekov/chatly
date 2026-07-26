import type { Timestamp } from "firebase/firestore";

export type MessageType = "text" | "voice" | "image" | "video" | "system";

export type MessageStatus = "sent" | "delivered" | "read";

export interface ChatMessage {
  id: string;
  senderId: string;
  type: MessageType;
  content: string | null;
  mediaURL: string | null;
  duration: number | null;
  status: MessageStatus;
  readBy: string[];
  deletedFor: string[];
  createdAt: Timestamp | null;
}
