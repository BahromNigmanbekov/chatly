"use client";

import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { reserveMessageId, sendMessage } from "@/lib/firebase/messages";
import {
  assertMaxSize,
  chatMediaPath,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  uploadToSupabase,
  UploadSizeError,
} from "@/lib/supabase/storage";
import { getVideoDuration } from "@/lib/utils/media";

interface MediaSendPreviewModalProps {
  file: File;
  chatId: string;
  uid: string;
  participantIds: string[];
  onClose: () => void;
  onSent: () => void;
}

/** Full-screen preview + confirm step shown after picking media, before it actually uploads/sends. */
export function MediaSendPreviewModal({ file, chatId, uid, participantIds, onClose, onSent }: MediaSendPreviewModalProps) {
  const [previewUrl] = useState(() => URL.createObjectURL(file));
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isVideo = file.type.startsWith("video/");

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  async function handleSend() {
    setError(null);
    try {
      assertMaxSize(file, isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES, isVideo ? 50 : 10);
    } catch (err) {
      setError(err instanceof UploadSizeError ? err.message : "Fayl juda katta");
      return;
    }

    setProgress(0);
    try {
      const messageId = reserveMessageId(chatId);
      const duration = isVideo ? await getVideoDuration(file) : null;
      const url = await uploadToSupabase(chatMediaPath(chatId, messageId, file.name), file, {
        onProgress: setProgress,
      });
      await sendMessage({
        chatId,
        senderId: uid,
        participantIds,
        type: isVideo ? "video" : "image",
        mediaURL: url,
        duration: duration ?? undefined,
        messageId,
      });
      onSent();
    } catch {
      setError("Yuklashda xatolik yuz berdi");
      setProgress(null);
    }
  }

  return (
    <div className="chatly-overlay-enter fixed inset-0 z-[60] flex flex-col bg-black">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ paddingTop: "calc(var(--safe-top) + 0.75rem)" }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={progress !== null}
          aria-label="Bekor qilish"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 disabled:opacity-40"
        >
          <FiX className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-white">{isVideo ? "Video" : "Rasm"}</span>
        <span className="w-9" aria-hidden />
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
        {isVideo ? (
          <video src={previewUrl} controls className="max-h-full max-w-full rounded-lg" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- local blob: preview URL, not a remote asset
          <img src={previewUrl} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        )}
      </div>

      {error && <p className="px-4 pb-2 text-center text-sm text-danger">{error}</p>}

      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 1rem)" }}
      >
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={progress !== null}>
          Bekor qilish
        </Button>
        <Button className="flex-1" onClick={handleSend} disabled={progress !== null}>
          {progress !== null ? `Yuklanmoqda... ${Math.round(progress)}%` : "Yuborish"}
        </Button>
      </div>
    </div>
  );
}
