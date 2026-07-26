"use client";

import Image from "next/image";
import { useState } from "react";
import { AudioPlayer } from "@/components/chat/AudioPlayer";
import { MediaViewer } from "@/components/chat/MediaViewer";
import { ReadStatusTicks } from "@/components/chat/ReadStatusTicks";
import { useEmulator } from "@/lib/firebase/client";
import { deleteMessage } from "@/lib/firebase/messages";
import { cn } from "@/lib/utils/cn";
import { formatMessageTime } from "@/lib/utils/formatTime";
import type { ChatMessage } from "@/types/message";

interface MessageBubbleProps {
  message: ChatMessage;
  mine: boolean;
  chatId: string;
  uid: string;
  senderName?: string;
}

export function MessageBubble({ message, mine, chatId, uid, senderName }: MessageBubbleProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (message.deletedFor.includes(uid)) return null;

  if (message.type === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-surface-raised px-3 py-1 text-xs text-text-muted">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("group flex", mine ? "justify-end" : "justify-start")}>
      <div className="relative flex max-w-[78%] flex-col gap-1 sm:max-w-[65%]">
        {!mine && senderName && (
          <span className="px-1 text-xs font-medium text-primary">{senderName}</span>
        )}
        <div
          className={cn(
            "relative px-3.5 py-2 text-sm shadow-sm",
            mine
              ? "rounded-2xl rounded-br-md bg-bubble-mine text-bubble-mine-text"
              : "rounded-2xl rounded-bl-md bg-bubble-theirs text-bubble-theirs-text",
          )}
        >
          {message.type === "text" && <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>}

          {message.type === "voice" && message.mediaURL && (
            <div className="min-w-45">
              <AudioPlayer src={message.mediaURL} duration={message.duration} mine={mine} />
            </div>
          )}

          {message.type === "image" && message.mediaURL && (
            <button type="button" onClick={() => setViewerOpen(true)} className="block">
              <Image
                src={message.mediaURL}
                alt="Rasm"
                width={280}
                height={280}
                unoptimized={useEmulator}
                className="max-h-72 w-full rounded-lg object-cover"
              />
            </button>
          )}

          {message.type === "video" && message.mediaURL && (
            <button type="button" onClick={() => setViewerOpen(true)} className="relative block">
              <video src={message.mediaURL} className="max-h-72 w-full rounded-lg" muted />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50">
                  <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
                    <path d="M7 5l12 7-12 7V5z" />
                  </svg>
                </span>
              </span>
            </button>
          )}

          {mine ? (
            <div className="mt-1 flex items-center justify-end gap-1.5">
              <span className="text-[11px] text-white/75">{formatMessageTime(message.createdAt)}</span>
              <ReadStatusTicks status={message.status} />
            </div>
          ) : (
            <div className="mt-1 flex justify-end">
              <span className="text-[11px] text-text-muted">{formatMessageTime(message.createdAt)}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Xabar variantlari"
          className={cn(
            "absolute top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-surface text-text-muted opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-hover:flex",
            mine ? "-left-7" : "-right-7",
          )}
        >
          ⋮
        </button>

        {menuOpen && (
          <div
            className={cn(
              "absolute top-8 z-10 flex flex-col overflow-hidden rounded-lg border border-border bg-surface text-sm shadow-md",
              mine ? "-left-7" : "-right-7",
            )}
          >
            <button
              type="button"
              className="px-3 py-2 text-left hover:bg-primary-soft"
              onClick={() => {
                setMenuOpen(false);
                void deleteMessage(chatId, message.id, uid, "me");
              }}
            >
              Faqat men uchun o&apos;chirish
            </button>
            {mine && (
              <button
                type="button"
                className="px-3 py-2 text-left text-danger hover:bg-primary-soft"
                onClick={() => {
                  setMenuOpen(false);
                  void deleteMessage(chatId, message.id, uid, "everyone");
                }}
              >
                Hamma uchun o&apos;chirish
              </button>
            )}
          </div>
        )}
      </div>

      {viewerOpen && message.mediaURL && (
        <MediaViewer
          src={message.mediaURL}
          type={message.type === "video" ? "video" : "image"}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
