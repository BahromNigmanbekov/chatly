import { onDisconnect, onValue, ref, serverTimestamp, set } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";

export interface PresenceStatus {
  state: "online" | "offline";
  last_changed: number | object;
}

function statusRef(uid: string) {
  return ref(rtdb, `/status/${uid}`);
}

/**
 * Tracks the current user's connection in Realtime Database. `onDisconnect` is
 * registered server-side by Firebase, so it fires even on a hard crash or a
 * dropped network — unlike a client-side heartbeat, this doesn't need polling
 * or a staleness guard. Returns a cleanup function for explicit sign-out.
 */
export function startPresenceTracking(uid: string): () => void {
  const myStatusRef = statusRef(uid);
  const connectedRef = ref(rtdb, ".info/connected");

  const unsub = onValue(connectedRef, (snap) => {
    if (snap.val() !== true) return;

    onDisconnect(myStatusRef)
      .set({ state: "offline", last_changed: serverTimestamp() })
      .then(() => {
        void set(myStatusRef, { state: "online", last_changed: serverTimestamp() });
      });
  });

  return () => {
    unsub();
    void set(myStatusRef, { state: "offline", last_changed: serverTimestamp() });
  };
}

/** Subscribes to another (or the same) user's presence. Returns an unsubscribe function. */
export function subscribeToPresence(
  uid: string,
  callback: (status: { online: boolean; lastChanged: number | null }) => void,
): () => void {
  return onValue(statusRef(uid), (snap) => {
    const data = snap.val() as PresenceStatus | null;
    callback({
      online: data?.state === "online",
      lastChanged: typeof data?.last_changed === "number" ? data.last_changed : null,
    });
  });
}
