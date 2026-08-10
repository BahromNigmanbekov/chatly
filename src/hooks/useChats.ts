"use client";

import { onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { chatsCol } from "@/lib/firebase/firestore";
import type { Chat } from "@/types/chat";

/**
 * No server-side orderBy here on purpose: Firestore excludes documents that
 * are missing the ordered field entirely, and a freshly created chat has
 * `lastMessage: null` (not a map with no `timestamp` — the field itself is
 * null), so `orderBy("lastMessage.timestamp")` silently dropped every chat
 * nobody had messaged in yet. Sorting client-side avoids that, falling back
 * to createdAt for chats with no messages yet.
 */
function chatSortKey(chat: Chat): number {
  return chat.lastMessage?.timestamp?.toMillis() ?? chat.createdAt?.toMillis() ?? 0;
}

export function useChats(uid: string | null | undefined) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setChats([]);
      setLoading(false);
      return;
    }

    const q = query(chatsCol, where("participantIds", "array-contains", uid));

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => d.data());
      docs.sort((a, b) => chatSortKey(b) - chatSortKey(a));
      setChats(docs);
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  return { chats, loading };
}
