"use client";

import { FiBookmark } from "react-icons/fi";
import { useMessageOnce } from "@/hooks/useMessageOnce";
import { unpinMessage } from "@/lib/firebase/messages";
import { messagePreviewText } from "@/lib/utils/messagePreview";

interface PinnedMessageBarProps {
  chatId: string;
  messageId: string;
  canUnpin: boolean;
}

export function PinnedMessageBar({ chatId, messageId, canUnpin }: PinnedMessageBarProps) {
  const message = useMessageOnce(chatId, messageId);
  if (!message) return null;

  return (
    <button
      type="button"
      onClick={() => document.getElementById(`msg-${messageId}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
      className="flex w-full items-center gap-2.5 border-b border-border bg-surface-raised px-4 py-2 text-left"
    >
      <FiBookmark className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-primary">Mahkamlangan xabar</div>
        <div className="truncate text-sm text-text-muted">{messagePreviewText(message)}</div>
      </div>
      {canUnpin && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            void unpinMessage(chatId);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              void unpinMessage(chatId);
            }
          }}
          className="shrink-0 text-xs font-medium text-text-muted hover:text-danger"
        >
          Bekor qilish
        </span>
      )}
    </button>
  );
}
