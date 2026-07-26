"use client";

import { useToastStore } from "@/store/useToastStore";

export function ToastHost() {
  const message = useToastStore((s) => s.message);
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="chatly-overlay-enter fixed inset-x-0 z-[60] flex justify-center px-4"
      style={{ bottom: "calc(var(--safe-bottom) + 84px)" }}
    >
      <div className="rounded-full bg-tab-active px-4 py-2.5 text-sm font-medium text-bg shadow-lg">
        {message}
      </div>
    </div>
  );
}
