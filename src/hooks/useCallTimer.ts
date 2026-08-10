"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/utils/formatTime";

/** Live "mm:ss" call duration, ticking every second from the moment the call actually connected. */
export function useCallTimer(callStartedAt: number | null): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!callStartedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [callStartedAt]);

  if (!callStartedAt) return "00:00";
  return formatDuration((now - callStartedAt) / 1000);
}
