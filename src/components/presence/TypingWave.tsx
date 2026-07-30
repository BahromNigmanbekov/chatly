import { FiMic } from "react-icons/fi";
import { cn } from "@/lib/utils/cn";

const DELAYS = ["0ms", "150ms", "300ms", "150ms"];

export function TypingWave({ variant = "text" }: { variant?: "text" | "voice" }) {
  return (
    <span className="inline-flex items-center gap-2 text-primary">
      {variant === "voice" && <FiMic className="h-3.5 w-3.5" aria-hidden />}
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
