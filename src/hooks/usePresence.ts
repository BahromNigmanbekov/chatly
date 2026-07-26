"use client";

import { useEffect, useState } from "react";
import { subscribeToPresence } from "@/lib/presence";

interface PresenceInfo {
  online: boolean;
  lastSeen: number | null;
  loading: boolean;
}

export function usePresence(uid: string | null | undefined): PresenceInfo {
  const [state, setState] = useState<PresenceInfo>({ online: false, lastSeen: null, loading: true });

  useEffect(() => {
    if (!uid) {
      setState({ online: false, lastSeen: null, loading: false });
      return;
    }

    const unsub = subscribeToPresence(uid, ({ online, lastChanged }) => {
      setState({ online, lastSeen: lastChanged, loading: false });
    });

    return unsub;
  }, [uid]);

  return state;
}
