"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { FiCheck, FiPlay } from "react-icons/fi";
import { AudioPlayer } from "@/components/chat/AudioPlayer";
import { MediaViewer } from "@/components/chat/MediaViewer";
import { MessageContextMenu, type MessageMenuItem } from "@/components/chat/MessageContextMenu";
import { ReactionsListModal } from "@/components/chat/ReactionsListModal";
import { ReadStatusTicks } from "@/components/chat/ReadStatusTicks";
import { ReplyQuote } from "@/components/chat/ReplyQuote";
import { RichContentCard } from "@/components/chat/RichContentCard";
import { VoiceExpiryBadge } from "@/components/chat/VoiceExpiryBadge";
import { Avatar } from "@/components/ui/Avatar";
import { useEmulator } from "@/lib/firebase/client";
import { pinMessage, toggleReaction, unpinMessage } from "@/lib/firebase/messages";
import { useModalStore } from "@/store/useModalStore";
import { useToastStore } from "@/store/useToastStore";
import { cn } from "@/lib/utils/cn";
import { formatMessageTime } from "@/lib/utils/formatTime";
import type { Chat } from "@/types/chat";
import { QUICK_REACTIONS, type ChatMessage } from "@/types/message";
import type { UserProfile } from "@/types/user";

interface MessageBubbleProps {
  message: ChatMessage;
  mine: boolean;
  chat: Chat;
  uid: string;
  senderName?: string;
  participantProfiles?: Record<string, UserProfile>;
  selectionMode: boolean;
  selected: boolean;
  onSelectAction: (messageId: string) => void;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
}

const LONG_PRESS_MS = 450;

export function MessageBubble({
  message,
  mine,
  chat,
  uid,
  senderName,
  participantProfiles,
  selectionMode,
  selected,
  onSelectAction,
  onReply,
  onEdit,
}: MessageBubbleProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [reactionsListOpen, setReactionsListOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setDeleteMessageTarget = useModalStore((s) => s.setDeleteMessageTarget);
  const setForwardMessageTarget = useModalStore((s) => s.setForwardMessageTarget);
  const showToast = useToastStore((s) => s.show);

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

  const isPinned = chat.pinnedMessageId === message.id;
  const canPin = chat.type === "direct" || chat.adminIds.includes(uid);

  function buildMenuItems(): MessageMenuItem[] {
    const items: MessageMenuItem[] = [{ label: "Javob berish", onSelect: () => onReply(message) }];
    if (mine && message.type === "text") {
      items.push({ label: "Tahrirlash", onSelect: () => onEdit(message) });
    }
    if (canPin) {
      items.push({
        label: isPinned ? "Mahkamlashni bekor qilish" : "Mahkamlash",
        onSelect: () => (isPinned ? unpinMessage(chat.id) : pinMessage(chat.id, message.id)),
      });
    }
    if (message.type === "text") {
      items.push({
        label: "Nusxalash",
        onSelect: () => {
          navigator.clipboard
            .writeText(message.content ?? "")
            .then(() => showToast("Nusxalandi"))
            .catch(() => showToast("Nusxalashning imkoni bo'lmadi"));
        },
      });
    }
    items.push({
      label: "Uzatish",
      onSelect: () => setForwardMessageTarget({ chatId: chat.id, messageIds: [message.id] }),
    });
    items.push({ label: "Tanlash", onSelect: () => onSelectAction(message.id) });
    items.push({
      label: "O'chirish",
      danger: true,
      onSelect: () => setDeleteMessageTarget({ chatId: chat.id, messageId: message.id, mine }),
    });
    return items;
  }

  function handleReact(emoji: string) {
    const alreadyReacted = (message.reactions?.[emoji] ?? []).includes(uid);
    toggleReaction(chat.id, message.id, uid, emoji, !alreadyReacted).catch(() => {
      showToast("Reaksiya qo'yib bo'lmadi");
    });
  }

  function handleBubbleClick() {
    if (selectionMode) onSelectAction(message.id);
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (selectionMode) return;
    e.preventDefault();
    setMenuAnchor({ x: e.clientX, y: e.clientY });
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (selectionMode) return;
    const touch = e.touches[0];
    pressTimer.current = setTimeout(() => {
      setMenuAnchor({ x: touch.clientX, y: touch.clientY });
    }, LONG_PRESS_MS);
  }

  function clearPressTimer() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  function handleDotsClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuAnchor({ x: rect.left, y: rect.bottom + 4 });
  }

  return (
    <div
      id={`msg-${message.id}`}
      className={cn("group flex items-center gap-2", mine ? "justify-end" : "justify-start")}
    >
      {selectionMode && !mine && (
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
            selected ? "border-primary bg-primary text-white" : "border-border",
          )}
          aria-hidden
        >
          {selected && (
            <FiCheck className="h-3 w-3" />
          )}
        </span>
      )}

      {!mine && chat.type === "group" && (
        <Avatar
          name={senderName ?? "..."}
          photoURL={participantProfiles?.[message.senderId]?.photoURL}
          size="sm"
          ring
          className="mb-1 self-end"
        />
      )}

      <div
        className="relative flex min-w-0 max-w-[78%] flex-col gap-1 sm:max-w-[65%]"
        onClick={handleBubbleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={clearPressTimer}
        onTouchMove={clearPressTimer}
      >
        {!mine && senderName && chat.type === "group" && (
          <span className="px-1 text-xs font-medium text-primary">{senderName}</span>
        )}

        {message.type === "card" && message.card ? (
          <RichContentCard card={message.card} chatId={chat.id} />
        ) : (
          <div
            className={cn(
              "relative px-3.5 py-2 text-sm shadow-sm",
              mine
                ? "rounded-2xl rounded-br-md bg-bubble-mine text-bubble-mine-text"
                : "rounded-2xl rounded-bl-md bg-bubble-theirs text-bubble-theirs-text",
              selectionMode && "cursor-pointer",
              selected && "ring-2 ring-primary ring-offset-2 ring-offset-bg",
            )}
          >
            {message.forwardedFrom && (
              <div className={cn("mb-1 text-xs italic", mine ? "text-white/70" : "text-text-muted")}>
                Uzatilgan: {message.forwardedFrom.senderName}
              </div>
            )}

            {message.replyTo && (
              <div className="mb-1.5">
                <ReplyQuote
                  senderName={message.replyTo.senderName}
                  textPreview={message.replyTo.textPreview}
                  tone={mine ? "onBubble" : "surface"}
                  onClick={() =>
                    document
                      .getElementById(`msg-${message.replyTo?.messageId}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                />
              </div>
            )}

            {message.type === "text" && <p className="whitespace-pre-wrap wrap-anywhere">{message.content}</p>}

            {message.type === "voice" && (
              <div className="min-w-45">
                {message.voiceExpired || !message.mediaURL ? (
                  <p className={cn("py-1 text-sm italic", mine ? "text-white/70" : "text-text-muted")}>
                    Ovozli xabar muddati tugadi
                  </p>
                ) : (
                  <>
                    <AudioPlayer src={message.mediaURL} duration={message.duration} mine={mine} />
                    {message.expiresAt && <VoiceExpiryBadge expiresAt={message.expiresAt} mine={mine} />}
                  </>
                )}
              </div>
            )}

            {message.type === "image" && message.mediaURL && (
              <button type="button" onClick={() => !selectionMode && setViewerOpen(true)} className="block">
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
              <button type="button" onClick={() => !selectionMode && setViewerOpen(true)} className="relative block">
                <video src={message.mediaURL} className="max-h-72 w-full rounded-lg" muted />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50">
                    <FiPlay className="h-4 w-4 fill-white text-white" />
                  </span>
                </span>
              </button>
            )}

            {mine ? (
              <div className="mt-1 flex items-center justify-end gap-1.5">
                {message.isEdited && <span className="text-[11px] text-white/60">tahrirlangan</span>}
                <span className="text-[11px] text-white/75">{formatMessageTime(message.createdAt)}</span>
                <ReadStatusTicks status={message.status} />
              </div>
            ) : (
              <div className="mt-1 flex justify-end gap-1.5">
                {message.isEdited && <span className="text-[11px] text-text-muted">tahrirlangan</span>}
                <span className="text-[11px] text-text-muted">{formatMessageTime(message.createdAt)}</span>
              </div>
            )}
          </div>
        )}

        {!selectionMode && (
          <button
            type="button"
            onClick={handleDotsClick}
            aria-label="Xabar variantlari"
            className={cn(
              "absolute top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-surface text-text-muted opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-hover:flex",
              mine ? "-left-7" : "-right-7",
            )}
          >
            ⋮
          </button>
        )}

        {Object.entries(message.reactions ?? {}).some(([, uids]) => uids.length > 0) && (
          <div className={cn("flex flex-wrap gap-1 px-1", mine ? "justify-end" : "justify-start")}>
            {Object.entries(message.reactions ?? {})
              .filter(([, uids]) => uids.length > 0)
              .map(([emoji, uids]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setReactionsListOpen(true)}
                  aria-label={`${emoji} bilan kimlar javob bergani`}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                    uids.includes(uid)
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-surface text-text-muted hover:bg-surface-raised",
                  )}
                >
                  <span>{emoji}</span>
                  <span className="tabular-nums">{uids.length}</span>
                </button>
              ))}
          </div>
        )}

        <MessageContextMenu
          anchor={menuAnchor}
          items={buildMenuItems()}
          onClose={() => setMenuAnchor(null)}
          reactionEmojis={QUICK_REACTIONS}
          onReact={handleReact}
        />

        <ReactionsListModal
          open={reactionsListOpen}
          onClose={() => setReactionsListOpen(false)}
          reactions={message.reactions ?? {}}
          participantProfiles={participantProfiles ?? {}}
        />
      </div>

      {selectionMode && mine && (
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
            selected ? "border-primary bg-primary text-white" : "border-border",
          )}
          aria-hidden
        >
          {selected && (
            <FiCheck className="h-3 w-3" />
          )}
        </span>
      )}

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
