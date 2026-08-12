"use client";

import { useEffect, useRef, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { FiCheck, FiPaperclip, FiX } from "react-icons/fi";
import { IoMic, IoSend } from "react-icons/io5";
import { Button } from "@/components/ui/Button";
import { MediaPickerSheet } from "@/components/chat/MediaPickerSheet";
import { MediaSendPreviewModal } from "@/components/chat/MediaSendPreviewModal";
import { ReplyQuote } from "@/components/chat/ReplyQuote";
import { useTypingPublisher } from "@/hooks/useTypingStatus";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { editMessage, reserveMessageId, sendMessage } from "@/lib/firebase/messages";
import { chatMediaPath, uploadToSupabase } from "@/lib/supabase/storage";
import { messagePreviewText } from "@/lib/utils/messagePreview";
import { formatDuration } from "@/lib/utils/formatTime";
import { cn } from "@/lib/utils/cn";
import type { ChatMessage } from "@/types/message";

const VOICE_MESSAGE_TTL_MS = 20 * 60 * 1000;

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
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
      const messageId = reserveMessageId(chatId);
      const url = await uploadToSupabase(
        chatMediaPath(chatId, messageId, "voice.webm"),
        result.blob,
        { onProgress: setUploadProgress },
      );
      await sendMessage({
        chatId,
        senderId: uid,
        participantIds,
        type: "voice",
        mediaURL: url,
        duration: result.durationSec,
        expiresAt: Timestamp.fromMillis(Date.now() + VOICE_MESSAGE_TTL_MS),
        messageId,
      });
    } finally {
      setUploadProgress(null);
    }
  }

  if (disabled) {
    return (
      <div className="rounded-t-2xl bg-surface px-4 py-3 text-center text-sm text-white/60">
        Bu guruhda faqat adminlar xabar yubora oladi
      </div>
    );
  }

  if (recorder.recording) {
    return (
      <div className="flex items-center gap-3 rounded-t-2xl bg-surface px-4 py-3">
        <span className="flex h-3 w-3 shrink-0 animate-pulse rounded-full bg-danger" />
        <span className="flex-1 text-sm text-white">Ovozli xabar yozilmoqda... {formatDuration(recorder.elapsedMs / 1000)}</span>
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
    <div className="rounded-t-2xl bg-surface" style={{ paddingBottom: "var(--safe-bottom)" }}>
      {editingMessage ? (
        <div className="flex items-center gap-2 rounded-t-2xl bg-white/10 px-3 py-1.5 text-xs">
          <span className="flex-1 font-medium text-white">Xabarni tahrirlash</span>
          <button
            type="button"
            onClick={() => {
              onCancelEdit();
              setText("");
            }}
            aria-label="Tahrirlashni bekor qilish"
            className="text-white/60 hover:text-white"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
      ) : (
        replyingTo && (
          <div className="px-3 py-1.5">
            <ReplyQuote
              senderName={senderNames[replyingTo.senderId] ?? "Kimdir"}
              textPreview={messagePreviewText(replyingTo)}
              onCancel={onCancelReply}
            />
          </div>
        )
      )}

      <MediaPickerSheet open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={setPendingFile} />
      {pendingFile && (
        <MediaSendPreviewModal
          file={pendingFile}
          chatId={chatId}
          uid={uid}
          participantIds={participantIds}
          onClose={() => setPendingFile(null)}
          onSent={() => setPendingFile(null)}
        />
      )}

      <div className="flex items-end gap-2 px-3 py-3">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Fayl biriktirish"
          disabled={uploadProgress !== null}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/10 disabled:opacity-50"
        >
          <FiPaperclip className="h-5 w-5" />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          placeholder="Your Message..."
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
          className="no-focus-ring max-h-32 min-h-10.5 flex-1 resize-none rounded-full border-none px-4 py-2.5 text-sm text-white outline-none placeholder:text-[#6B6875] focus:outline-none focus:ring-0 focus-visible:outline-none"
          style={{ background: "#1C1C1E" }}
        />

        {uploadProgress !== null && (
          <span className="text-xs text-white/60">{Math.round(uploadProgress)}%</span>
        )}

        {text.trim() ? (
          <button
            type="button"
            onClick={handleSendText}
            aria-label={editingMessage ? "Saqlash" : "Yuborish"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "#CFCCE4", color: "#1C1B2E" }}
          >
            {editingMessage ? <FiCheck className="h-4 w-4" /> : <IoSend className="h-4 w-4" />}
          </button>
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
            className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full")}
            style={{ background: "#CFCCE4", color: "#1C1B2E" }}
          >
            <IoMic className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
