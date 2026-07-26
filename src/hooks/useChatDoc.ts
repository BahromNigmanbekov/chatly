"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { chatDoc } from "@/lib/firebase/firestore";
import type { Chat } from "@/types/chat";

export function useChatDoc(chatId: string | null | undefined) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setChat(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(chatDoc(chatId), (snap) => {
      setChat(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
    return unsub;
  }, [chatId]);

  return { chat, loading };
}
