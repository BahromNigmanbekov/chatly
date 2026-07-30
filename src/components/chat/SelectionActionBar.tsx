"use client";

import { FiX } from "react-icons/fi";

interface SelectionActionBarProps {
  count: number;
  onForward: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function SelectionActionBar({ count, onForward, onDelete, onCancel }: SelectionActionBarProps) {
  return (
    <div
      className="flex min-h-14 shrink-0 items-center gap-2 border-t border-border bg-surface px-3"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <button
        type="button"
        onClick={onCancel}
        aria-label="Tanlashni bekor qilish"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-raised"
      >
        <FiX className="h-5 w-5" />
      </button>
      <span className="flex-1 text-sm font-medium text-text">{count} ta tanlandi</span>
      <button
        type="button"
        disabled={count === 0}
        onClick={onForward}
        className="flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium text-primary hover:bg-primary-soft disabled:opacity-40"
      >
        Uzatish
      </button>
      <button
        type="button"
        disabled={count === 0}
        onClick={onDelete}
        className="flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium text-danger hover:bg-accent-soft disabled:opacity-40"
      >
        O&apos;chirish
      </button>
    </div>
  );
}
