"use client";

import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

interface CallControlButtonProps {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  label: string;
  children: ReactNode;
  large?: boolean;
}

export function CallControlButton({ onClick, active, danger, label, children, large }: CallControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full shadow-lg transition-colors",
        large ? "h-16 w-16" : "h-14 w-14",
        danger
          ? "bg-danger text-white"
          : active
            ? "bg-white text-black"
            : "bg-white/15 text-white backdrop-blur",
      )}
    >
      {children}
    </button>
  );
}
