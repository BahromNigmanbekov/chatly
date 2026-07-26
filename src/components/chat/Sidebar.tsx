"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ChatList } from "@/components/chat/ChatList";
import { useAuthStore } from "@/store/useAuthStore";

export function Sidebar() {
  const profile = useAuthStore((s) => s.profile);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
        <span className="font-display text-xl font-bold text-primary">Chatly</span>
        <div className="flex items-center gap-1.5">
          <Link
            href="/search"
            aria-label="Foydalanuvchi qidirish"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-primary-soft"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </Link>
          <Link
            href="/groups/new"
            aria-label="Yangi guruh yaratish"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-primary-soft"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </Link>
          <ThemeToggle />
          <Link href="/profile" aria-label="Profil">
            <Avatar name={profile?.displayName ?? "?"} photoURL={profile?.photoURL} size="sm" />
          </Link>
        </div>
      </div>
      <ChatList />
    </div>
  );
}
