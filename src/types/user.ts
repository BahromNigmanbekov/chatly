import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string | null;
  bio: string;
  createdAt: Timestamp | null;
}

export interface UsernameClaim {
  userId: string;
}
