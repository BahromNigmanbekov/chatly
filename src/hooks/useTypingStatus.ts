"use client";

import { deleteField, serverTimestamp, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef } from "react";
import { chatDoc } from "@/lib/firebase/firestore";

const TYPING_CLEAR_MS = 3_000;

/** Returns a setter that writes/clears chats/{chatId}.typingStatus.{uid}. */
export function useTypingPublisher(chatId: string, uid: string) {
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastType = useRef<"text" | "voice" | null>(null);

  const write = useCallback(
    (type: "text" | "voice" | null) => {
      lastType.current = type;
      void updateDoc(chatDoc(chatId), {
        [`typingStatus.${uid}`]: type ? { type, updatedAt: serverTimestamp() } : deleteField(),
      }).catch(() => undefined);
    },
    [chatId, uid],
  );

  const setTyping = useCallback(
    (type: "text" | "voice" | null) => {
      if (clearTimer.current) clearTimeout(clearTimer.current);

      if (type === null) {
        write(null);
        return;
      }

      if (lastType.current !== type) write(type);

      clearTimer.current = setTimeout(() => write(null), TYPING_CLEAR_MS);
    },
    [write],
  );

  useEffect(() => {
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
      write(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, uid]);

  return setTyping;
}

const STALE_TYPING_MS = 5_000;

export function isTypingEntryFresh(updatedAtMillis: number): boolean {
  return Date.now() - updatedAtMillis < STALE_TYPING_MS;
}
