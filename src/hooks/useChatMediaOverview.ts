"use client";

import { getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { messagesCol } from "@/lib/firebase/firestore";
import type { ChatMessage } from "@/types/message";

interface MediaOverview {
  imageMessages: ChatMessage[];
  videoMessages: ChatMessage[];
  voiceCount: number;
  loading: boolean;
}

/**
 * Single-field orderBy query (no composite index needed) over the most recent
 * 200 messages, split client-side by type. "Stats" here mean "within recent
 * history," not a lifetime total — good enough for a details-panel summary
 * without provisioning a new Firestore index for this.
 */
export function useChatMediaOverview(chatId: string): MediaOverview {
  const [state, setState] = useState<MediaOverview>({
    imageMessages: [],
    videoMessages: [],
    voiceCount: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    getDocs(query(messagesCol(chatId), orderBy("createdAt", "desc"), limit(200))).then((snap) => {
      if (cancelled) return;
      const messages = snap.docs.map((d) => d.data());
      setState({
        imageMessages: messages.filter((m) => m.type === "image"),
        videoMessages: messages.filter((m) => m.type === "video"),
        voiceCount: messages.filter((m) => m.type === "voice").length,
        loading: false,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  return state;
}
