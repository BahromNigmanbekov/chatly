"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { useParticipantProfiles } from "@/hooks/useParticipantProfiles";
import type { Chat } from "@/types/chat";

export function ChatWindow({ chat, uid }: { chat: Chat; uid: string }) {
  const participantProfiles = useParticipantProfiles(chat.type === "group" ? chat.participantIds : []);
  const senderNames = Object.fromEntries(
    Object.entries(participantProfiles).map(([id, p]) => [id, p.displayName]),
  );
  const canPost = !chat.onlyAdminsCanPost || chat.adminIds.includes(uid);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatHeader chat={chat} uid={uid} participantProfiles={participantProfiles} />
      <MessageList chat={chat} uid={uid} senderNames={senderNames} />
      <MessageInput chatId={chat.id} uid={uid} participantIds={chat.participantIds} disabled={!canPost} />
    </div>
  );
}
