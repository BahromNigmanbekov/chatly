"use client";

import { useModalStore } from "@/store/useModalStore";
import type { MessageCard } from "@/types/message";

const ICONS: Record<MessageCard["icon"], React.ReactNode> = {
  group: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M8 12a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM16 12a3 3 0 100-6 3 3 0 000 6zM2.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M13 14.2c2.6.3 4.5 2.1 4.5 4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v5M12 8v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

export function RichContentCard({ card, chatId }: { card: MessageCard; chatId: string }) {
  const setGroupSettingsChatId = useModalStore((s) => s.setGroupSettingsChatId);

  return (
    <div className="flex w-64 flex-col gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          {ICONS[card.icon]}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-text">{card.title}</div>
          <div className="truncate text-xs text-text-muted">{card.subtitle}</div>
        </div>
      </div>
      {card.actionLabel && (
        <button
          type="button"
          onClick={() => setGroupSettingsChatId(chatId)}
          className="min-h-9 rounded-lg bg-primary-soft px-3 text-sm font-medium text-primary hover:opacity-80"
        >
          {card.actionLabel}
        </button>
      )}
    </div>
  );
}
