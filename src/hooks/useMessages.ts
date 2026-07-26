"use client";

import {
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { messagesCol } from "@/lib/firebase/firestore";
import type { ChatMessage } from "@/types/message";

const PAGE_SIZE = 30;

export function useMessages(chatId: string | null | undefined) {
  const [recent, setRecent] = useState<ChatMessage[]>([]);
  const [older, setOlder] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const oldestLoadedRef = useRef<QueryDocumentSnapshot<ChatMessage> | null>(null);

  useEffect(() => {
    setOlder([]);
    setHasMore(true);
    oldestLoadedRef.current = null;

    if (!chatId) {
      setRecent([]);
      setLoading(false);
      return;
    }

    const q = query(messagesCol(chatId), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
    const unsub = onSnapshot(q, (snap) => {
      setRecent(snap.docs.map((d) => d.data()).reverse());
      if (snap.docs.length > 0) {
        oldestLoadedRef.current = snap.docs[snap.docs.length - 1];
      }
      setHasMore(snap.docs.length === PAGE_SIZE);
      setLoading(false);
    });

    return unsub;
  }, [chatId]);

  const loadMore = useCallback(async () => {
    if (!chatId || !oldestLoadedRef.current || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        messagesCol(chatId),
        orderBy("createdAt", "desc"),
        startAfter(oldestLoadedRef.current),
        limit(PAGE_SIZE),
      );
      const snap = await getDocs(q);
      const page = snap.docs.map((d) => d.data()).reverse();
      setOlder((prev) => [...page, ...prev]);
      if (snap.docs.length > 0) {
        oldestLoadedRef.current = snap.docs[snap.docs.length - 1];
      }
      setHasMore(snap.docs.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, hasMore, loadingMore]);

  return { messages: [...older, ...recent], loading, loadMore, hasMore, loadingMore };
}
