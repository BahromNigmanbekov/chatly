"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Constrains the desktop dialog width. Defaults to a comfortable form width. */
  maxWidthClassName?: string;
}

/** Centered dialog on desktop, bottom sheet on mobile. Closes on overlay click, Escape, or the mobile back button. */
export function Modal({ open, onClose, title, children, maxWidthClassName = "sm:max-w-md" }: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const container = containerRef.current;
        if (!container) return;
        const focusable = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    // Treat the mobile/browser back button as a close action: push a history
    // entry when the modal opens, and pop it (closing the modal) on popstate.
    history.pushState({ chatlyModal: true }, "");
    function handlePopState() {
      onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);
    document.body.style.overflow = "hidden";
    containerRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    // Consume the history entry we pushed on open, unless a popstate already did.
    if (history.state?.chatlyModal) history.back();
    else onClose();
  }

  if (!open) return null;

  return (
    <div
      className="chatly-overlay-enter fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={handleClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "chatly-sheet-enter sm:chatly-dialog-enter flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface sm:max-h-[80vh] sm:rounded-2xl sm:shadow-xl",
          maxWidthClassName,
        )}
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" aria-hidden />
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3.5">
            <span className="font-semibold text-text">{title}</span>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Yopish"
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-raised"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
