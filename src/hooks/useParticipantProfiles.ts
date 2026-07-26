"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { userDoc } from "@/lib/firebase/firestore";
import type { UserProfile } from "@/types/user";

/** Subscribes to each participant's profile doc. Keyed map stays stable across chat updates. */
export function useParticipantProfiles(participantIds: string[]) {
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const key = participantIds.slice().sort().join(",");

  useEffect(() => {
    const unsubs = participantIds.map((uid) =>
      onSnapshot(userDoc(uid), (snap) => {
        if (!snap.exists()) return;
        setProfiles((prev) => ({ ...prev, [uid]: snap.data() }));
      }),
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return profiles;
}
