"use client";

import { useUserProfile } from "@/hooks/useUserProfile";
import { usePresence } from "@/hooks/usePresence";
import type { Chat } from "@/types/chat";

export function otherParticipantId(chat: Chat, uid: string): string | null {
  if (chat.type !== "direct") return null;
  return chat.participantIds.find((id) => id !== uid) ?? null;
}

/** Resolves what to show for a chat: name/photo (peer profile for direct, group fields for group)
 *  plus presence info (only meaningful for direct chats). */
export function useChatDisplay(chat: Chat | null | undefined, uid: string) {
  const peerId = chat ? otherParticipantId(chat, uid) : null;
  const { profile: peerProfile, loading } = useUserProfile(peerId);
  const presence = usePresence(peerId);

  if (!chat) {
    return { name: "", photoURL: null, isGroup: false, peerId: null, peerProfile: null, presence, loading: false };
  }

  if (chat.type === "group") {
    return {
      name: chat.groupName ?? "Guruh",
      photoURL: chat.groupPhotoURL,
      isGroup: true,
      peerId: null,
      peerProfile: null,
      presence,
      loading: false,
    };
  }

  return {
    name: peerProfile?.displayName ?? "...",
    photoURL: peerProfile?.photoURL ?? null,
    isGroup: false,
    peerId,
    peerProfile,
    presence,
    loading,
  };
}
