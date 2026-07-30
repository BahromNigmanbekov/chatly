"use client";

import { useEffect, useState } from "react";
import type { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils/cn";

export function VoiceExpiryBadge({ expiresAt, mine }: { expiresAt: Timestamp; mine: boolean }) {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      setMinutesLeft(Math.max(0, Math.ceil((expiresAt.toMillis() - Date.now()) / 60_000)));
    }
    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (minutesLeft === null) return null;

  return (
    <span className={cn("mt-0.5 block text-[10px]", mine ? "text-white/60" : "text-text-muted")}>
      {minutesLeft > 0 ? `${minutesLeft} daqiqadan keyin o'chadi` : "tez orada o'chadi"}
    </span>
  );
}
