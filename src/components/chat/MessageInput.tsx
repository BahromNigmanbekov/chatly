"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ReplyQuote } from "@/components/chat/ReplyQuote";
import { useTypingPublisher } from "@/hooks/useTypingStatus";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { editMessage, sendMessage } from "@/lib/firebase/messages";
import { chatMediaPath, uploadWithProgress } from "@/lib/firebase/storage";
import { getVideoDuration } from "@/lib/utils/media";
import { messagePreviewText } from "@/lib/utils/messagePreview";
import { formatDuration } from "@/lib/utils/formatTime";
import { cn } from "@/lib/utils/cn";
import type { ChatMessage } from "@/types/message";

interface MessageInputProps {
  chatId: string;
  uid: string;
  participantIds: string[];
  disabled?: boolean;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  senderNames: Record<string, string>;
  editingMessage: ChatMessage | null;
  onCancelEdit: () => void;
}

export function MessageInput({
  chatId,
  uid,
  participantIds,
  disabled,
  replyingTo,
  onCancelReply,
  senderNames,
  editingMessage,
  onCancelEdit,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const setTyping = useTypingPublisher(chatId, uid);
  const recorder = useVoiceRecorder();

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content ?? "");
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  async function handleSendText() {
    const content = text.trim();
    if (!content) return;

    if (editingMessage) {
      setText("");
      onCancelEdit();
      await editMessage(chatId, editingMessage.id, content);
      return;
    }

    setText("");
    setTyping(null);
    await sendMessage({
      chatId,
      senderId: uid,
      participantIds,
      type: "text",
      content,
      replyTo: replyingTo
        ? {
            messageId: replyingTo.id,
            senderName: senderNames[replyingTo.senderId] ?? "Kimdir",
            textPreview: messagePreviewText(replyingTo).slice(0, 120),
          }
        : undefined,
    });
    onCancelReply();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) return;

    setUploadProgress(0);
    try {
      const duration = isVideo ? await getVideoDuration(file) : null;
      const url = await uploadWithProgress(chatMediaPath(chatId, uid, file.name), file, setUploadProgress);
      await sendMessage({
        chatId,
        senderId: uid,
        participantIds,
        type: isVideo ? "video" : "image",
        mediaURL: url,
        duration: duration ?? undefined,
      });
    } finally {
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRecordStart() {
    if (disabled) return;
    try {
      await recorder.start();
      setTyping("voice");
    } catch {
      // mic permission denied — silently ignore, button just won't start recording
    }
  }

  async function handleRecordStop() {
    if (!recorder.recording) return;
    const result = await recorder.stop();
    setTyping(null);
    if (!result) return;
    setUploadProgress(0);
    try {
      const url = await uploadWithProgress(
        chatMediaPath(chatId, uid, "voice.webm"),
        result.blob,
        setUploadProgress,
      );
      await sendMessage({
        chatId,
        senderId: uid,
        participantIds,
        type: "voice",
        mediaURL: url,
        duration: result.durationSec,
      });
    } finally {
      setUploadProgress(null);
    }
  }

  if (disabled) {
    return (
      <div className="border-t border-border px-4 py-3 text-center text-sm text-text-muted">
        Bu guruhda faqat adminlar xabar yubora oladi
      </div>
    );
  }

  if (recorder.recording) {
    return (
      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <span className="flex h-3 w-3 shrink-0 animate-pulse rounded-full bg-danger" />
        <span className="flex-1 text-sm text-text">Ovozli xabar yozilmoqda... {formatDuration(recorder.elapsedMs / 1000)}</span>
        <Button variant="danger" size="sm" onClick={() => { recorder.cancel(); setTyping(null); }}>
          Bekor qilish
        </Button>
        <Button size="sm" onClick={handleRecordStop}>
          Yuborish
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-border" style={{ paddingBottom: "var(--safe-bottom)" }}>
      {editingMessage ? (
        <div className="flex items-center gap-2 border-b border-border bg-surface-raised px-3 py-1.5 text-xs">
          <span className="flex-1 font-medium text-primary">Xabarni tahrirlash</span>
          <button
            type="button"
            onClick={() => {
              onCancelEdit();
              setText("");
            }}
            aria-label="Tahrirlashni bekor qilish"
            className="text-text-muted hover:text-text"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : (
        replyingTo && (
          <div className="border-b border-border px-3 py-1.5">
            <ReplyQuote
              senderName={senderNames[replyingTo.senderId] ?? "Kimdir"}
              textPreview={messagePreviewText(replyingTo)}
              onCancel={onCancelReply}
            />
          </div>
        )
      )}

      <div className="flex items-end gap-2 px-3 py-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Fayl biriktirish"
          disabled={uploadProgress !== null}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-raised disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M8 12l6.5-6.5a3.5 3.5 0 015 5L11 18a5 5 0 01-7-7l7.5-7.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          placeholder="Xabar yozing..."
          onChange={(e) => {
            setText(e.target.value);
            setTyping(e.target.value.trim() ? "text" : null);
          }}
          onFocus={() => {
            setTimeout(() => textareaRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }), 300);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSendText();
            }
          }}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus-visible:border-primary"
        />

        {uploadProgress !== null && (
          <span className="text-xs text-text-muted">{Math.round(uploadProgress)}%</span>
        )}

        {text.trim() ? (
          <Button size="icon" onClick={handleSendText} aria-label={editingMessage ? "Saqlash" : "Yuborish"}>
            {editingMessage ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M4 12l16-7-6 16-3-7-7-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            )}
          </Button>
        ) : (
          <button
            type="button"
            onMouseDown={handleRecordStart}
            onMouseUp={handleRecordStop}
            onMouseLeave={() => recorder.recording && handleRecordStop()}
            onTouchStart={(e) => {
              e.preventDefault();
              void handleRecordStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              void handleRecordStop();
            }}
            aria-label="Ovozli xabar yozish uchun bosib turing"
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white",
            )}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0M12 18v2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
