"use client";

import { onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { chatsCol } from "@/lib/firebase/firestore";
import type { Chat } from "@/types/chat";

export function useChats(uid: string | null | undefined) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setChats([]);
      setLoading(false);
      return;
    }

    const q = query(
      chatsCol,
      where("participantIds", "array-contains", uid),
      orderBy("lastMessage.timestamp", "desc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map((d) => d.data()));
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  return { chats, loading };
}
