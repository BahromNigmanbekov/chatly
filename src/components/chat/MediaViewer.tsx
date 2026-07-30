"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";

interface MediaViewerProps {
  src: string;
  type: "image" | "video";
  onClose: () => void;
}

export function MediaViewer({ src, type, onClose }: MediaViewerProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Yopish"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <FiX className="h-5 w-5" />
      </button>
      {type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="max-h-full max-w-full rounded-lg object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <video
          src={src}
          controls
          autoPlay
          className="max-h-full max-w-full rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
