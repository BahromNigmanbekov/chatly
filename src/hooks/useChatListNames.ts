"use client";

import { useMemo } from "react";
import { useParticipantProfiles } from "@/hooks/useParticipantProfiles";
import { otherParticipantId } from "@/hooks/useChatDisplay";
import type { Chat } from "@/types/chat";

/**
 * Resolves per-chat text used for local search filtering: display name (or
 * group name) plus, for direct chats, the peer's @username — so searching an
 * existing contact by their exact handle still surfaces the chat even when
 * it doesn't appear in their display name.
 */
export function useChatListNames(chats: Chat[], uid: string): Record<string, string> {
  const peerIds = useMemo(() => {
    const ids = chats
      .filter((c) => c.type === "direct")
      .map((c) => otherParticipantId(c, uid))
      .filter((id): id is string => Boolean(id));
    return Array.from(new Set(ids));
  }, [chats, uid]);

  const profiles = useParticipantProfiles(peerIds);

  return useMemo(() => {
    const names: Record<string, string> = {};
    for (const chat of chats) {
      if (chat.type === "group") {
        names[chat.id] = chat.groupName ?? "Guruh";
      } else {
        const peerId = otherParticipantId(chat, uid);
        const peerProfile = peerId ? profiles[peerId] : undefined;
        names[chat.id] = [peerProfile?.displayName, peerProfile?.username].filter(Boolean).join(" ");
      }
    }
    return names;
  }, [chats, uid, profiles]);
}
