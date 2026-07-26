"use client";

import { useMemo } from "react";
import { useParticipantProfiles } from "@/hooks/useParticipantProfiles";
import { otherParticipantId } from "@/hooks/useChatDisplay";
import type { Chat } from "@/types/chat";

/** Resolves a display name per chat (group name, or the other participant's name) for local search filtering. */
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
        names[chat.id] = (peerId && profiles[peerId]?.displayName) || "";
      }
    }
    return names;
  }, [chats, uid, profiles]);
}
