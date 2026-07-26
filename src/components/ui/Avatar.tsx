import Image from "next/image";
import { useEmulator } from "@/lib/firebase/client";
import { cn } from "@/lib/utils/cn";

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 88,
};

interface AvatarProps {
  name: string;
  photoURL?: string | null;
  size?: keyof typeof sizeMap;
  className?: string;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({ name, photoURL, size = "md", className }: AvatarProps) {
  const px = sizeMap[size];

  if (photoURL) {
    return (
      <Image
        src={photoURL}
        alt={name}
        width={px}
        height={px}
        unoptimized={useEmulator}
        className={cn("rounded-full object-cover shrink-0", className)}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary-soft text-primary font-display font-semibold shrink-0",
        className,
      )}
      style={{ width: px, height: px, fontSize: px * 0.36 }}
    >
      {initialsFrom(name)}
    </div>
  );
}
