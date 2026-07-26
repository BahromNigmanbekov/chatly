import type { Timestamp } from "firebase/firestore";

export type MessageType = "text" | "voice" | "image" | "video" | "system" | "card";

export type MessageStatus = "sent" | "delivered" | "read";

export interface ReplyPreview {
  messageId: string;
  senderName: string;
  textPreview: string;
}

export interface ForwardedFromInfo {
  chatId: string;
  senderName: string;
}

export interface MessageCard {
  icon: "group" | "info";
  title: string;
  subtitle: string;
  actionLabel: string | null;
}

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
  isEdited: boolean;
  editedAt: Timestamp | null;
  replyTo: ReplyPreview | null;
  forwardedFrom: ForwardedFromInfo | null;
  card: MessageCard | null;
  createdAt: Timestamp | null;
}
