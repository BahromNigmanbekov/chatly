"use client";

import { onSnapshot, query, Timestamp, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { storiesCol } from "@/lib/firebase/firestore";
import type { Story } from "@/types/story";

/** Active (non-expired) stories from a given set of uids (self + contacts), grouped by author and sorted oldest-first within each group. */
export function useStories(uid: string | null | undefined, contactIds: string[]) {
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    if (!uid) {
      setStories([]);
      return;
    }
    const q = query(storiesCol, where("expiresAt", ">", Timestamp.now()));
    const unsub = onSnapshot(q, (snap) => setStories(snap.docs.map((d) => d.data())));
    return unsub;
  }, [uid]);

  const relevantUids = useMemo(() => new Set([uid, ...contactIds].filter(Boolean) as string[]), [uid, contactIds]);

  const storiesByUid = useMemo(() => {
    const byUid = new Map<string, Story[]>();
    for (const story of stories) {
      if (!relevantUids.has(story.uid)) continue;
      const list = byUid.get(story.uid) ?? [];
      list.push(story);
      byUid.set(story.uid, list);
    }
    for (const list of byUid.values()) {
      list.sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0));
    }
    return byUid;
  }, [stories, relevantUids]);

  return { storiesByUid };
}
