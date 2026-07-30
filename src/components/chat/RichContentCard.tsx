"use client";

import { FiInfo, FiUsers } from "react-icons/fi";
import { useModalStore } from "@/store/useModalStore";
import type { MessageCard } from "@/types/message";

const ICONS: Record<MessageCard["icon"], React.ReactNode> = {
  group: <FiUsers className="h-5 w-5" />,
  info: <FiInfo className="h-5 w-5" />,
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
