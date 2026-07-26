import { cn } from "@/lib/utils/cn";

export function OnlineDot({ online, className }: { online: boolean; className?: string }) {
  if (!online) return null;
  return (
    <span className={cn("relative flex h-3 w-3", className)}>
      <span className="chatly-presence-dot absolute inset-0 rounded-full bg-online" />
      <span className="relative h-3 w-3 rounded-full bg-online ring-2 ring-surface" />
    </span>
  );
}
