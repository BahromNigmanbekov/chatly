"use client";

import { useRef } from "react";
import { FiCamera, FiFile, FiImage } from "react-icons/fi";
import { cn } from "@/lib/utils/cn";

interface MediaPickerSheetProps {
  open: boolean;
  onClose: () => void;
  onPick: (file: File) => void;
}

/** Telegram-style "+" bottom sheet: Galereya / Kamera / Fayl. */
export function MediaPickerSheet({ open, onClose, onPick }: MediaPickerSheetProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    onClose();
    if (file) onPick(file);
  }

  return (
    <>
      {open && (
        <div
          className="chatly-overlay-enter fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={onClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "chatly-sheet-enter sm:chatly-dialog-enter w-full max-w-sm rounded-t-2xl bg-surface sm:rounded-2xl sm:shadow-xl",
            )}
            style={{ paddingBottom: "var(--safe-bottom)" }}
          >
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden />
            <div className="flex flex-col gap-1 p-3">
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex items-center gap-4 rounded-xl px-3 py-3.5 text-left hover:bg-surface-raised"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <FiImage className="h-5 w-5" />
                </span>
                <span className="text-[15px] font-medium text-text">Galereya</span>
              </button>

              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-4 rounded-xl px-3 py-3.5 text-left hover:bg-surface-raised"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <FiCamera className="h-5 w-5" />
                </span>
                <span className="text-[15px] font-medium text-text">Kamera</span>
              </button>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-4 rounded-xl px-3 py-3.5 text-left hover:bg-surface-raised"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <FiFile className="h-5 w-5" />
                </span>
                <span className="text-[15px] font-medium text-text">Fayl</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-1 rounded-xl px-3 py-3 text-center text-[15px] font-medium text-danger hover:bg-surface-raised"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={galleryRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleChange} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleChange} />
    </>
  );
}
