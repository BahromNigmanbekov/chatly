"use client";

import { onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { doc } from "firebase/firestore";
import { messagesCol } from "@/lib/firebase/firestore";
import type { ChatMessage } from "@/types/message";

/** Subscribes to a single message doc (used for pinned-message banners / reply previews). */
export function useMessageOnce(chatId: string | null | undefined, messageId: string | null | undefined) {
  const [message, setMessage] = useState<ChatMessage | null>(null);

  useEffect(() => {
    if (!chatId || !messageId) {
      setMessage(null);
      return;
    }
    const unsub = onSnapshot(doc(messagesCol(chatId), messageId), (snap) => {
      setMessage(snap.exists() ? snap.data() : null);
    });
    return unsub;
  }, [chatId, messageId]);

  return message;
}
