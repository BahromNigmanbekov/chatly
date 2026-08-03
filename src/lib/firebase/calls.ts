import { getDocs, limit, query, serverTimestamp, Timestamp, updateDoc, where } from "firebase/firestore";
import { callDoc, callsCol } from "@/lib/firebase/firestore";
import type { CallStatus } from "@/types/call";

const TERMINAL_STATUSES: CallStatus[] = ["ended", "declined", "missed"];

export async function setCallStatus(chatId: string, callId: string, status: CallStatus) {
  const patch: Record<string, unknown> = { status };
  if (status === "active") patch.answeredAt = serverTimestamp();
  if (TERMINAL_STATUSES.includes(status)) patch.endedAt = serverTimestamp();
  await updateDoc(callDoc(chatId, callId), patch);
}

const RINGING_TIMEOUT_MS = 45_000;

/**
 * Best-effort housekeeping, run when a chat is opened (no Cloud Functions in
 * this phase): marks long-abandoned 1:1 "ringing" calls as missed. Group
 * calls skip "ringing" entirely (see types/call.ts) — there's no equivalent
 * unanswered-timeout state for those, so nothing to sweep. There's no
 * candidate/offer/answer cleanup either now that Daily owns the media
 * transport; an abandoned room is reclaimed by its own `exp` TTL regardless.
 */
export async function cleanupStaleCalls(chatId: string, uid: string) {
  const now = Date.now();
  const scoped = where("participantIds", "array-contains", uid);
  const ringingSnap = await getDocs(query(callsCol(chatId), scoped, where("status", "==", "ringing"), limit(10)));
  for (const docSnap of ringingSnap.docs) {
    const call = docSnap.data();
    const createdMs = call.createdAt instanceof Timestamp ? call.createdAt.toMillis() : 0;
    if (createdMs && now - createdMs > RINGING_TIMEOUT_MS) {
      await setCallStatus(chatId, call.id, "missed");
    }
  }
}
