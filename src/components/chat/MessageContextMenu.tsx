"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface MessageMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

interface MessageContextMenuProps {
  anchor: { x: number; y: number } | null;
  items: MessageMenuItem[];
  onClose: () => void;
}

/** A small positioned popover (long-press point on mobile, cursor point on right-click, or button on hover-click). Clamped to the viewport. */
export function MessageContextMenu({ anchor, items, onClose }: MessageContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!anchor) {
      setStyle(null);
      return;
    }
    const menuWidth = 200;
    const menuHeight = items.length * 40 + 16;
    const left = Math.min(Math.max(8, anchor.x), window.innerWidth - menuWidth - 8);
    const top = Math.min(Math.max(8, anchor.y), window.innerHeight - menuHeight - 8);
    setStyle({ left, top });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  useEffect(() => {
    if (!anchor) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [anchor, onClose]);

  if (!anchor || !style) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
      <div
        ref={ref}
        role="menu"
        className="chatly-dialog-enter fixed z-50 min-w-[190px] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl"
        style={{ left: style.left, top: style.top }}
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={() => {
              item.onSelect();
              onClose();
            }}
            className={cn(
              "flex min-h-10 w-full items-center px-3.5 text-left text-sm hover:bg-surface-raised",
              item.danger ? "text-danger" : "text-text",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
