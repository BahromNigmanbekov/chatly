"use client";

import { useEffect, useState } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { useParticipantProfiles } from "@/hooks/useParticipantProfiles";
import { cleanupStaleCalls } from "@/lib/firebase/calls";
import { useAuthStore } from "@/store/useAuthStore";
import type { Chat } from "@/types/chat";
import type { ChatMessage } from "@/types/message";

export function ChatWindow({ chat, uid }: { chat: Chat; uid: string }) {
  const ownProfile = useAuthStore((s) => s.profile);
  const participantProfiles = useParticipantProfiles(chat.participantIds);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

  useEffect(() => {
    void cleanupStaleCalls(chat.id, uid);
  }, [chat.id, uid]);

  const senderNames = Object.fromEntries(
    Object.entries(participantProfiles).map(([id, p]) => [id, p.displayName]),
  );
  if (ownProfile) senderNames[uid] = ownProfile.displayName;

  const canPost = !chat.onlyAdminsCanPost || chat.adminIds.includes(uid);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatHeader chat={chat} uid={uid} participantProfiles={participantProfiles} />
      <MessageList
        chat={chat}
        uid={uid}
        senderNames={senderNames}
        onReply={setReplyingTo}
        onEdit={setEditingMessage}
      />
      <MessageInput
        chatId={chat.id}
        uid={uid}
        participantIds={chat.participantIds}
        disabled={!canPost}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        senderNames={senderNames}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
}
