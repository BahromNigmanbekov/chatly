"use client";

import { getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { usersCol } from "@/lib/firebase/firestore";
import { normalizeUsername } from "@/lib/utils/username";
import type { UserProfile } from "@/types/user";

export function useUserSearch(rawTerm: string, excludeUid?: string | null) {
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = normalizeUsername(rawTerm);
    if (term.length === 0) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timeout = setTimeout(async () => {
      const q = query(
        usersCol,
        orderBy("username"),
        where("username", ">=", term),
        where("username", "<=", term + ""),
        limit(20),
      );
      const snap = await getDocs(q);
      if (cancelled) return;
      setResults(snap.docs.map((d) => d.data()).filter((u) => u.uid !== excludeUid));
      setLoading(false);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [rawTerm, excludeUid]);

  return { results, loading };
}
