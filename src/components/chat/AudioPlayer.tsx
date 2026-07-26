"use client";

import { useRef, useState } from "react";
import { formatDuration } from "@/lib/utils/formatTime";
import { cn } from "@/lib/utils/cn";

export function AudioPlayer({ src, duration, mine }: { src: string; duration: number | null; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play();
    }
  }

  return (
    <div className="flex items-center gap-2.5 py-1">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "To'xtatish" : "Ovozli xabarni tinglash"}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          mine ? "bg-white/20 text-white" : "bg-primary-soft text-primary",
        )}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M7 5l12 7-12 7V5z" />
          </svg>
        )}
      </button>
      <div className="flex h-7 flex-1 items-center gap-[2px]" aria-hidden>
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className={cn("w-[3px] rounded-full", mine ? "bg-white/50" : "bg-primary/40")}
            style={{ height: `${20 + ((i * 37) % 60)}%` }}
          />
        ))}
      </div>
      <span className={cn("shrink-0 text-xs tabular-nums", mine ? "text-white/80" : "text-text-muted")}>
        {formatDuration(playing || currentTime > 0 ? currentTime : duration)}
      </span>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        className="hidden"
      />
    </div>
  );
}
