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

export function Avatar({ name, photoURL, size = "md", className, ring }: AvatarProps) {
  const px = sizeMap[size];
  const ringStyle = ring ? { boxShadow: "0 0 0 2px var(--color-surface), 0 0 0 4px #b9b3d6" } : undefined;

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

  // Same light gradient as the chat body, so every photo-less avatar matches
  // instead of each getting a random per-name color. It's light, so the
  // initials need a dark ink (the bubble-text token) to stay legible.
  return (
    <div
      className={cn("chat-body-gradient flex items-center justify-center rounded-full font-display font-semibold shrink-0", className)}
      style={{ width: px, height: px, fontSize: px * 0.36, color: "var(--color-bubble-mine-text)", ...ringStyle }}
    >
      {initialsFrom(name)}
    </div>
  );
}
