import { cn } from "@/lib/utils/cn";

const DELAYS = ["0ms", "150ms", "300ms", "150ms"];

export function TypingWave({ variant = "text" }: { variant?: "text" | "voice" }) {
  return (
    <span className="inline-flex items-center gap-2 text-primary">
      {variant === "voice" && (
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
          <path
            d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0M12 18v2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span className="flex h-3 items-end gap-[2.5px]" aria-hidden>
        {DELAYS.map((delay, i) => (
          <span
            key={i}
            className={cn("chatly-wave-bar w-[3px] rounded-full bg-primary")}
            style={{ height: "100%", animationDelay: delay }}
          />
        ))}
      </span>
    </span>
  );
}
