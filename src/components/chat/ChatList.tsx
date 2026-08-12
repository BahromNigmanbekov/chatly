"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useChats } from "@/hooks/useChats";
import { useChatListNames } from "@/hooks/useChatListNames";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useAuthStore } from "@/store/useAuthStore";
import { ChatListItem } from "@/components/chat/ChatListItem";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { getOrCreateDirectChat } from "@/lib/firebase/chats";
import { otherParticipantId } from "@/hooks/useChatDisplay";

export function ChatList({ searchTerm }: { searchTerm: string }) {
  const router = useRouter();
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const { chats, loading } = useChats(uid);
  const names = useChatListNames(chats, uid ?? "");
  const [openingUid, setOpeningUid] = useState<string | null>(null);

  const isSearching = searchTerm.trim().length > 0;
  const { results: peopleResults } = useUserSearch(isSearching ? searchTerm : "", uid);

  const visibleChats = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return chats.filter((chat) => {
      if (term && !names[chat.id]?.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [chats, searchTerm, names]);

  // Global people search, deduped against direct chats already shown above — a
  // single search box covers both "find in my chats" and "start a new chat".
  const existingDirectPeerIds = useMemo(
    () => new Set(chats.filter((c) => c.type === "direct").map((c) => otherParticipantId(c, uid ?? ""))),
    [chats, uid],
  );
  const newPeopleResults = isSearching
    ? peopleResults.filter((u) => !existingDirectPeerIds.has(u.uid))
    : [];

  // Pinned chats float to the top — no section header, matching a normal chat app's flat list (a small pin glyph on the row itself is the only cue).
  const sortedChats = useMemo(() => {
    const isPinned = (chat: (typeof visibleChats)[number]) => (chat.pinnedBy ?? []).includes(uid ?? "");
    return [...visibleChats].sort((a, b) => Number(isPinned(b)) - Number(isPinned(a)));
  }, [visibleChats, uid]);

  async function openChatWith(targetUid: string) {
    if (!uid || openingUid) return;
    setOpeningUid(targetUid);
    try {
      const chatId = await getOrCreateDirectChat(uid, targetUid);
      router.push(`/chats/${chatId}`);
    } finally {
      setOpeningUid(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (chats.length === 0 && !isSearching) {
    return (
      <EmptyState
        title="Hali suhbatlar yo'q"
        description="@username orqali odam qidiring yoki yangi guruh yarating."
      />
    );
  }

  const nothingFound = visibleChats.length === 0 && newPeopleResults.length === 0;

  return (
    <div>
      {nothingFound ? (
        <EmptyState
          title="Hech narsa topilmadi"
          description="Boshqa nom bilan qidirib ko'ring yoki filtrni almashtiring."
        />
      ) : (
        <div className="flex flex-col gap-0.5 p-2">
          {sortedChats.map((chat) => (
            <ChatListItem key={chat.id} chat={chat} />
          ))}

          {newPeopleResults.length > 0 && (
            <>
              <div className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Odamlar
              </div>
              {newPeopleResults.map((user) => (
                <button
                  key={user.uid}
                  type="button"
                  onClick={() => openChatWith(user.uid)}
                  disabled={openingUid === user.uid}
                  className="flex min-h-18 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-white/5 disabled:opacity-60"
                >
                  <Avatar name={user.displayName} photoURL={user.photoURL} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display font-semibold text-text">{user.displayName}</div>
                    <div className="truncate text-sm text-text-muted">@{user.username}</div>
                  </div>
                  {openingUid === user.uid && <Spinner className="h-4 w-4" />}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
