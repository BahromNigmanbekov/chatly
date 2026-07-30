"use client";

import type { ReactNode } from "react";
import { FiChevronRight } from "react-icons/fi";
import { cn } from "@/lib/utils/cn";

interface ProfileMenuRowProps {
  icon: ReactNode;
  label: string;
  trailing?: string;
  danger?: boolean;
  onClick: () => void;
}

export function ProfileMenuRow({ icon, label, trailing, danger, onClick }: ProfileMenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center gap-3 px-4 text-left hover:bg-surface-raised"
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          danger ? "bg-accent-soft text-danger" : "bg-primary-soft text-primary",
        )}
      >
        {icon}
      </span>
      <span className={cn("flex-1 text-sm font-medium", danger ? "text-danger" : "text-text")}>{label}</span>
      {trailing && <span className="text-sm text-text-muted">{trailing}</span>}
      {!danger && <FiChevronRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />}
    </button>
  );
}
