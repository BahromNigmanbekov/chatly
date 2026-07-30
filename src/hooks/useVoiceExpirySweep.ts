"use client";

import { useEffect, useRef } from "react";
import { expireVoiceMessage } from "@/lib/firebase/messages";
import { deleteFromSupabase, pathFromPublicUrl } from "@/lib/supabase/storage";
import type { ChatMessage } from "@/types/message";

const CHECK_INTERVAL_MS = 30_000;

/**
 * Best-effort client-side sweep: any participant whose client has this chat
 * open may notice an expired voice message and clear it — there's no backend
 * job in this phase. Runs on mount/chat-change, on every messages update, and
 * on a timer (expiry is time-based, so a chat sitting open with no new
 * messages still needs to notice the 20-minute mark passing).
 */
export function useVoiceExpirySweep(chatId: string, messages: ChatMessage[]) {
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    function sweep() {
      const now = Date.now();
      for (const message of messages) {
        if (
          message.type !== "voice" ||
          message.voiceExpired ||
          !message.mediaURL ||
          !message.expiresAt ||
          message.expiresAt.toMillis() > now ||
          inFlightRef.current.has(message.id)
        ) {
          continue;
        }
        inFlightRef.current.add(message.id);
        const path = pathFromPublicUrl(message.mediaURL);
        void (async () => {
          try {
            if (path) await deleteFromSupabase(path);
            await expireVoiceMessage(chatId, message.id);
          } catch {
            inFlightRef.current.delete(message.id); // retry on next sweep
          }
        })();
      }
    }

    sweep();
    const interval = setInterval(sweep, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [chatId, messages]);
}
