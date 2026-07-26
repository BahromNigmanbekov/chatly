"use client";

import { useMemo, useState } from "react";
import { useChats } from "@/hooks/useChats";
import { useChatListNames } from "@/hooks/useChatListNames";
import { useAuthStore } from "@/store/useAuthStore";
import { ChatListFilterBar, type ChatFilter } from "@/components/chat/ChatListFilterBar";
import { ChatListItem } from "@/components/chat/ChatListItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";

export function ChatList() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const { chats, loading } = useChats(uid);
  const names = useChatListNames(chats, uid ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<ChatFilter>("all");

  const visibleChats = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return chats.filter((chat) => {
      if (filter === "unread" && !((chat.unreadCounts?.[uid ?? ""] ?? 0) > 0)) return false;
      if (filter === "groups" && chat.type !== "group") return false;
      if (term && !names[chat.id]?.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [chats, filter, searchTerm, names, uid]);

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
    <div className="flex flex-1 flex-col overflow-hidden">
      <ChatListFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filter={filter}
        onFilterChange={setFilter}
      />
      {visibleChats.length === 0 ? (
        <EmptyState
          title="Hech narsa topilmadi"
          description="Boshqa nom bilan qidirib ko'ring yoki filtrni almashtiring."
        />
      ) : (
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {visibleChats.map((chat) => (
            <ChatListItem key={chat.id} chat={chat} />
          ))}
        </div>
      )}
    </div>
  );
}
