"use client";

import { useEffect, useRef } from "react";
import { getDocs, query, where } from "firebase/firestore";
import { storiesCol } from "@/lib/firebase/firestore";
import { deleteStory } from "@/lib/firebase/stories";
import { deleteFromSupabase, pathFromPublicUrl } from "@/lib/supabase/storage";

const CHECK_INTERVAL_MS = 60_000;

/**
 * Best-effort client-side sweep: once a story is 24h old, its Supabase file
 * and Firestore doc are actually deleted, not just hidden from the active
 * query — otherwise storage would grow forever. Mirrors useVoiceExpirySweep's
 * pattern (no backend cron job in this phase). Firestore rules only let a
 * story's own uploader delete it, so this only ever runs against the signed-in
 * user's own expired stories — that's fine, since it just needs to run
 * whenever that user's own client happens to be open.
 */
export function useStoryExpirySweep(uid: string | null | undefined) {
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!uid) return;

    async function sweep() {
      const snap = await getDocs(query(storiesCol, where("uid", "==", uid)));
      const now = Date.now();
      for (const story of snap.docs.map((d) => d.data())) {
        if (!story.expiresAt || story.expiresAt.toMillis() > now || inFlightRef.current.has(story.id)) {
          continue;
        }
        inFlightRef.current.add(story.id);
        void (async () => {
          try {
            const path = pathFromPublicUrl(story.mediaURL);
            if (path) await deleteFromSupabase(path);
            await deleteStory(story.id);
          } catch {
            inFlightRef.current.delete(story.id); // retry on next sweep
          }
        })();
      }
    }

    void sweep();
    const interval = setInterval(sweep, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [uid]);
}
