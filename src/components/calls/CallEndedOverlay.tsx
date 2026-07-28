"use client";

import { useEffect } from "react";
import { useCallStore } from "@/store/useCallStore";

const REASON_TEXT: Record<string, string> = {
  declined: "Qo'ng'iroq rad etildi",
  missed: "Javob berilmadi",
  ended: "Qo'ng'iroq tugadi",
};

export function CallEndedOverlay() {
  const endedReason = useCallStore((s) => s.endedReason);
  const error = useCallStore((s) => s.error);
  const dismissEndedBanner = useCallStore((s) => s.dismissEndedBanner);

  useEffect(() => {
    const timer = setTimeout(dismissEndedBanner, 2200);
    return () => clearTimeout(timer);
  }, [dismissEndedBanner]);

  return (
    <div className="chatly-overlay-enter fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-6">
      <div className="rounded-2xl bg-surface px-6 py-5 text-center shadow-xl">
        <p className="text-text">{error ?? (endedReason ? REASON_TEXT[endedReason] : "Qo'ng'iroq tugadi")}</p>
      </div>
    </div>
  );
}
