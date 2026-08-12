import Image from "next/image";
import { useEmulator } from "@/lib/firebase/client";
import { cn } from "@/lib/utils/cn";

const sizeMap = {
  sm: 32,
  md: 40,
  header: 34,
  lg: 52,
  story: 56,
  xl: 88,
};

interface AvatarProps {
  name: string;
  photoURL?: string | null;
  size?: keyof typeof sizeMap;
  className?: string;
  /** Adds a colorful ring (deterministic per name) around the avatar, matching the chat-list reference design. */
  ring?: boolean;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const RING_COLORS = ["#f472b6", "#4f8dfd", "#fb923c", "#34d399", "#a78bfa", "#fbbf24"];

function ringColorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return RING_COLORS[hash % RING_COLORS.length];
}

export function Avatar({ name, photoURL, size = "md", className, ring }: AvatarProps) {
  const px = sizeMap[size];
  const ringStyle = ring ? { boxShadow: `0 0 0 2px var(--color-surface), 0 0 0 4px ${ringColorFor(name)}` } : undefined;

  if (photoURL) {
    return (
      <Image
        src={photoURL}
        alt={name}
        width={px}
        height={px}
        unoptimized={useEmulator}
        className={cn("rounded-full object-cover shrink-0", className)}
        style={{ width: px, height: px, ...ringStyle }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary-soft text-primary font-display font-semibold shrink-0",
        className,
      )}
      style={{ width: px, height: px, fontSize: px * 0.36, ...ringStyle }}
    >
      {initialsFrom(name)}
    </div>
  );
}
