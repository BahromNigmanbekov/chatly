import { FiCheck } from "react-icons/fi";
import { cn } from "@/lib/utils/cn";
import type { MessageStatus } from "@/types/message";

interface ReadStatusTicksProps {
  status: MessageStatus;
  /** "onBubble" = light strokes for the colored sent-bubble; "muted" = for use on plain surfaces (e.g. the chat list preview). */
  tone?: "onBubble" | "muted";
}

export function ReadStatusTicks({ status, tone = "onBubble" }: ReadStatusTicksProps) {
  const isRead = status === "read";
  const showDouble = status === "delivered" || status === "read";

  const colorClass =
    tone === "muted"
      ? isRead
        ? "text-primary"
        : "text-text-muted"
      : isRead
        ? "text-bubble-mine-text"
        : "text-bubble-time";

  return (
    <span
      className={cn("relative inline-flex h-3 shrink-0", showDouble ? "w-4" : "w-3", colorClass)}
      aria-label={status === "read" ? "O'qildi" : status === "delivered" ? "Yetkazildi" : "Yuborildi"}
    >
      <FiCheck className="absolute left-0 h-3 w-3" strokeWidth={2.5} />
      {showDouble && <FiCheck className="absolute left-1.25 h-3 w-3" strokeWidth={2.5} />}
    </span>
  );
}
