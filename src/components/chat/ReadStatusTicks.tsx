import { cn } from "@/lib/utils/cn";
import type { MessageStatus } from "@/types/message";

export function ReadStatusTicks({ status }: { status: MessageStatus }) {
  const isRead = status === "read";
  const showDouble = status === "delivered" || status === "read";

  return (
    <svg
      viewBox="0 0 20 12"
      className={cn("h-3 w-4", isRead ? "text-white" : "text-white/70")}
      aria-label={
        status === "read" ? "O'qildi" : status === "delivered" ? "Yetkazildi" : "Yuborildi"
      }
    >
      <path
        d="M1 6.5L4.5 10L10 3"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDouble && (
        <path
          d="M7 6.5L10.5 10L16 3"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
