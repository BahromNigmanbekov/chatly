"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackButton } from "@/components/chat/BackButton";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserSearch } from "@/hooks/useUserSearch";
import { getOrCreateDirectChat } from "@/lib/firebase/chats";

export default function SearchPage() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const [term, setTerm] = useState("");
  const [opening, setOpening] = useState<string | null>(null);
  const { results, loading } = useUserSearch(term, uid);

  async function openChat(targetUid: string) {
    if (!uid || opening) return;
    setOpening(targetUid);
    try {
      const chatId = await getOrCreateDirectChat(uid, targetUid);
      router.push(`/chats/${chatId}`);
    } finally {
      setOpening(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
        <BackButton />
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
            @
          </span>
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="username qidiring"
            className="h-11 w-full rounded-xl border border-border bg-surface pl-8 pr-3.5 text-sm text-text placeholder:text-text-muted focus-visible:border-primary"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {!loading && term.trim().length > 0 && results.length === 0 && (
          <EmptyState title="Hech kim topilmadi" description="Boshqa username bilan urinib ko'ring." />
        )}

        {!loading && term.trim().length === 0 && (
          <EmptyState title="Foydalanuvchi qidiring" description="@username yozishni boshlang." />
        )}

        {results.map((user) => (
          <button
            key={user.uid}
            type="button"
            onClick={() => openChat(user.uid)}
            disabled={opening === user.uid}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary-soft disabled:opacity-60"
          >
            <Avatar name={user.displayName} photoURL={user.photoURL} size="md" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-text">{user.displayName}</div>
              <div className="truncate text-sm text-text-muted">@{user.username}</div>
            </div>
            {opening === user.uid && <Spinner className="h-4 w-4" />}
          </button>
        ))}
      </div>
    </div>
  );
}
