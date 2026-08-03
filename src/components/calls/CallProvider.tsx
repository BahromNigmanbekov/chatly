"use client";

import { onSnapshot, query, where } from "firebase/firestore";
import { useEffect } from "react";
import { ActiveCallScreen } from "@/components/calls/ActiveCallScreen";
import { CallEndedOverlay } from "@/components/calls/CallEndedOverlay";
import { IncomingCallScreen } from "@/components/calls/IncomingCallScreen";
import { callsGroup } from "@/lib/firebase/firestore";
import { useAuthStore } from "@/store/useAuthStore";
import { useCallStore } from "@/store/useCallStore";

export function CallProvider() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const setIncomingCall = useCallStore((s) => s.setIncomingCall);
  const phase = useCallStore((s) => s.phase);

  useEffect(() => {
    if (!uid) return;
    // array-contains + status-in, mirroring the /chats query pattern — Firestore
    // can only prove a `list` query safe against a rule that checks
    // array-membership on the exact field the filter constrains, so we filter
    // broadly here and pick the relevant case client-side: a 1:1 call still
    // "ringing" where I'm not the caller, or a group call that's "active"
    // (group calls skip ringing — see types/call.ts) which I haven't started.
    const q = query(
      callsGroup,
      where("participantIds", "array-contains", uid),
      where("status", "in", ["ringing", "active"]),
    );
    const unsub = onSnapshot(q, (snap) => {
      const docSnap = snap.docs.find((d) => {
        const data = d.data();
        if (data.callerId === uid) return false;
        if (!data.isGroup && data.status === "ringing") return true;
        if (data.isGroup && data.status === "active") return true;
        return false;
      });
      setIncomingCall(docSnap ? docSnap.data() : null);
    });
    return unsub;
  }, [uid, setIncomingCall]);

  if (phase === "incoming") return <IncomingCallScreen />;
  if (phase === "outgoing" || phase === "active") return <ActiveCallScreen />;
  if (phase === "ended") return <CallEndedOverlay />;
  return null;
}
