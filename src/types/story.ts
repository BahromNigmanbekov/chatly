import type { Timestamp } from "firebase/firestore";

export const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export interface Story {
  id: string;
  uid: string;
  mediaURL: string;
  mediaType: "image" | "video";
  createdAt: Timestamp | null;
  expiresAt: Timestamp | null;
  viewedBy: string[];
  /** Emoji -> uids who reacted with it. */
  reactions: Record<string, string[]>;
}
