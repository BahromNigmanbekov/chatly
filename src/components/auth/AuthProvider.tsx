"use client";

import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { useEffect, type ReactNode } from "react";
import { auth } from "@/lib/firebase/client";
import { userDoc } from "@/lib/firebase/firestore";
import { startPresenceTracking } from "@/lib/presence";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthProvider({ children }: { children: ReactNode }) {
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let stopPresence: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubProfile?.();
      stopPresence?.();
      setFirebaseUser(user);

      if (user) {
        unsubProfile = onSnapshot(userDoc(user.uid), (snap) => {
          setProfile(snap.exists() ? snap.data() : null);
        });
        stopPresence = startPresenceTracking(user.uid);
      } else {
        setProfile(null);
      }

      setInitializing(false);
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
      stopPresence?.();
    };
  }, [setFirebaseUser, setProfile, setInitializing]);

  return <>{children}</>;
}
