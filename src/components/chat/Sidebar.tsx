"use client";

import { FiPlus } from "react-icons/fi";
import { ChatList } from "@/components/chat/ChatList";
import { useModalStore } from "@/store/useModalStore";

/** Minimal header — just the title. Search, theme, and profile all live inside ChatList's own search box, Profile's settings rows, and the bottom tab bar, not as a row of icons up here. */
export function Sidebar() {
  const setGroupCreateOpen = useModalStore((s) => s.setGroupCreateOpen);

  return (
    <div className="relative flex h-full flex-col">
      <div
        className="flex shrink-0 items-center border-b border-border px-4 py-3.5"
        style={{ paddingTop: "calc(var(--safe-top) + 0.875rem)" }}
      >
        <span className="font-display text-xl font-bold text-text">Suhbatlar</span>
      </div>
      <ChatList />

      {/* New group — mobile only; desktop uses the IconRail's "+" instead. */}
      <button
        type="button"
        onClick={() => setGroupCreateOpen(true)}
        aria-label="Yangi guruh yaratish"
        className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover md:hidden"
      >
        <FiPlus className="h-6 w-6" aria-hidden />
      </button>
    </div>
  );
}
