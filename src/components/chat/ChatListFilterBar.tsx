"use client";

import { cn } from "@/lib/utils/cn";

export type ChatFilter = "all" | "unread" | "groups";

const FILTERS: { id: ChatFilter; label: string }[] = [
  { id: "all", label: "Hammasi" },
  { id: "unread", label: "O'qilmagan" },
  { id: "groups", label: "Guruhlar" },
];

interface ChatListFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filter: ChatFilter;
  onFilterChange: (filter: ChatFilter) => void;
}

export function ChatListFilterBar({
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
}: ChatListFilterBarProps) {
  return (
    <div className="flex flex-col gap-2.5 border-b border-border px-3 pb-3 pt-1">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          aria-hidden
        >
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Suhbatlarni qidirish"
          aria-label="Suhbatlarni qidirish"
          className="h-11 w-full rounded-xl border border-border bg-surface-raised pl-10 pr-3.5 text-sm text-text placeholder:text-text-muted focus-visible:border-primary"
        />
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Suhbatlarni filtrlash">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => onFilterChange(f.id)}
            className={cn(
              "min-h-[36px] rounded-full px-3.5 text-sm font-medium transition-colors",
              filter === f.id
                ? "bg-primary text-white"
                : "bg-surface-raised text-text-muted hover:text-text",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
