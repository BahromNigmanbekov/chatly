"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { userDoc } from "@/lib/firebase/firestore";
import type { UserProfile } from "@/types/user";

export function useUserProfile(uid: string | null | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(userDoc(uid), (snap) => {
      setProfile(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { profile, loading };
}
