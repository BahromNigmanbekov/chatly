"use client";

import { useChats } from "@/hooks/useChats";
import { useAuthStore } from "@/store/useAuthStore";
import { ChatListItem } from "@/components/chat/ChatListItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";

export function ChatList() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const { chats, loading } = useChats(uid);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <EmptyState
        title="Hali suhbatlar yo'q"
        description="@username orqali odam qidiring yoki yangi guruh yarating."
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
      {chats.map((chat) => (
        <ChatListItem key={chat.id} chat={chat} />
      ))}
    </div>
  );
}
