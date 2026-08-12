"use client";

import { FiX } from "react-icons/fi";
import { cn } from "@/lib/utils/cn";

interface ReplyQuoteProps {
  senderName: string;
  textPreview: string;
  onClick?: () => void;
  onCancel?: () => void;
  tone?: "onBubble" | "surface";
}

export function ReplyQuote({ senderName, textPreview, onClick, onCancel, tone = "surface" }: ReplyQuoteProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border-l-2 border-primary py-1 pl-2 pr-2 text-xs",
        onClick && "cursor-pointer",
        tone === "onBubble" ? "bg-white/10" : "bg-surface-raised",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className={cn("font-medium", tone === "onBubble" ? "text-inherit" : "text-primary")}>{senderName}</div>
        <div className={cn("truncate", tone === "onBubble" ? "opacity-80" : "text-text-muted")}>{textPreview}</div>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          aria-label="Javobni bekor qilish"
          className="shrink-0 text-text-muted hover:text-text"
        >
          <FiX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
