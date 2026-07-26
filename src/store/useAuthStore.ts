import { create } from "zustand";
import type { User } from "firebase/auth";
import type { UserProfile } from "@/types/user";

interface AuthState {
  firebaseUser: User | null;
  profile: UserProfile | null;
  initializing: boolean;
  setFirebaseUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setInitializing: (initializing: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  initializing: true,
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setProfile: (profile) => set({ profile }),
  setInitializing: (initializing) => set({ initializing }),
}));
