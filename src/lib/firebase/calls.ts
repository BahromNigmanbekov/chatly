import { deleteDoc, getDocs, limit, query, serverTimestamp, Timestamp, updateDoc, where } from "firebase/firestore";
import { callDoc, callerCandidatesCol, calleeCandidatesCol, callsCol } from "@/lib/firebase/firestore";
import type { CallStatus } from "@/types/call";

const TERMINAL_STATUSES: CallStatus[] = ["ended", "declined", "missed"];

export async function setCallStatus(chatId: string, callId: string, status: CallStatus) {
  const patch: Record<string, unknown> = { status };
  if (status === "active") patch.answeredAt = serverTimestamp();
  if (TERMINAL_STATUSES.includes(status)) {
    patch.endedAt = serverTimestamp();
    // The SDP blobs have no further use once a call is over — drop them
    // along with the ICE candidates (cleanupCallCandidates) rather than
    // leaving old offer/answer payloads sitting in the call doc.
    patch.offer = null;
    patch.answer = null;
  }
  await updateDoc(callDoc(chatId, callId), patch);
}

/** Deletes every ICE candidate doc for a call — run once the call ends, by whichever side notices first. */
export async function cleanupCallCandidates(chatId: string, callId: string) {
  const [callerSnap, calleeSnap] = await Promise.all([
    getDocs(callerCandidatesCol(chatId, callId)),
    getDocs(calleeCandidatesCol(chatId, callId)),
  ]);
  await Promise.all([
    ...callerSnap.docs.map((d) => deleteDoc(d.ref)),
    ...calleeSnap.docs.map((d) => deleteDoc(d.ref)),
  ]);
}

const RINGING_TIMEOUT_MS = 45_000;
const STALE_CALL_AGE_MS = 60 * 60 * 1000;

/**
 * Best-effort housekeeping, run when a chat is opened (no Cloud Functions in
 * this phase): marks long-abandoned "ringing" calls as missed, and clears
 * leftover ICE candidates for any call that ended over an hour ago but never
 * got cleaned up (e.g. a client crashed mid-call before it could clean up).
 */
export async function cleanupStaleCalls(chatId: string, uid: string) {
  const now = Date.now();
  // array-contains on participantIds, same reason as the incoming-call
  // listener's query — this is what the rules can actually prove is safe.
  const scoped = where("participantIds", "array-contains", uid);

  const ringingSnap = await getDocs(query(callsCol(chatId), scoped, where("status", "==", "ringing"), limit(10)));
  for (const docSnap of ringingSnap.docs) {
    const call = docSnap.data();
    const createdMs = call.createdAt instanceof Timestamp ? call.createdAt.toMillis() : 0;
    if (createdMs && now - createdMs > RINGING_TIMEOUT_MS) {
      await setCallStatus(chatId, call.id, "missed");
      await cleanupCallCandidates(chatId, call.id);
    }
  }

  for (const status of TERMINAL_STATUSES) {
    const snap = await getDocs(query(callsCol(chatId), scoped, where("status", "==", status), limit(10)));
    for (const docSnap of snap.docs) {
      const call = docSnap.data();
      const endedMs = call.endedAt instanceof Timestamp ? call.endedAt.toMillis() : 0;
      if (endedMs && now - endedMs > STALE_CALL_AGE_MS) {
        await cleanupCallCandidates(chatId, call.id);
        // Defensive: clears any offer/answer left over from before this cleanup
        // existed, or from a client that crashed mid-call before it could run.
        if (call.offer || call.answer) {
          await updateDoc(callDoc(chatId, call.id), { offer: null, answer: null });
        }
      }
    }
  }
}
