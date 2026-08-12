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
import { Emoji, EmojiText } from "@/components/ui/Emoji";
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
  const hasReactions = Object.values(message.reactions ?? {}).some((uids) => uids.length > 0);

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
            selected ? "border-white bg-white text-black" : "border-border",
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
        className={cn("relative flex min-w-0 max-w-[62%] flex-col gap-1", hasReactions && "mb-2.5")}
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
              "relative rounded-[14px] px-2.75 py-1.75 text-[12.5px]",
              mine ? "rounded-br-[5px] bg-bubble-mine text-bubble-mine-text" : "rounded-bl-[5px] bg-bubble-theirs text-bubble-theirs-text",
              selectionMode && "cursor-pointer",
              selected && "ring-2 ring-white ring-offset-2 ring-offset-[#b3b0cc]",
            )}
          >
            {message.forwardedFrom && (
              <div className="mb-1 text-xs italic text-bubble-time">
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

            {message.type === "text" && (
              <p className="whitespace-pre-wrap wrap-anywhere leading-snug">
                <EmojiText text={message.content ?? ""} />
                <span className="ml-1.5 inline-flex items-center gap-1 align-bottom whitespace-nowrap" style={{ opacity: 0.55 }}>
                  {message.isEdited && <span style={{ fontSize: 9.5 }}>tahrirlangan</span>}
                  <span style={{ fontSize: 9.5 }}>{formatMessageTime(message.createdAt)}</span>
                  {mine && <ReadStatusTicks status={message.status} />}
                </span>
              </p>
            )}

            {message.type === "voice" && (
              <div className="min-w-45">
                {message.voiceExpired || !message.mediaURL ? (
                  <p className="py-1 text-sm italic text-bubble-time">
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

            {message.type !== "text" && (
              mine ? (
                <div className="mt-1 flex items-center justify-end gap-1.5">
                  {message.isEdited && <span className="text-[9.5px] text-bubble-time">tahrirlangan</span>}
                  <span className="text-[9.5px] text-bubble-time">{formatMessageTime(message.createdAt)}</span>
                  <ReadStatusTicks status={message.status} />
                </div>
              ) : (
                <div className="mt-1 flex justify-end gap-1.5">
                  {message.isEdited && <span className="text-[9.5px] text-bubble-time">tahrirlangan</span>}
                  <span className="text-[9.5px] text-bubble-time">{formatMessageTime(message.createdAt)}</span>
                </div>
              )
            )}
          </div>
        )}

        {!selectionMode && (
          <button
            type="button"
            onClick={handleDotsClick}
            aria-label="Xabar variantlari"
            className={cn(
              "absolute top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-white text-[#1c1b2e] opacity-0 transition-opacity group-hover:opacity-100 group-hover:flex",
              mine ? "-left-7" : "-right-7",
            )}
          >
            ⋮
          </button>
        )}

        {(() => {
          const activeReactions = Object.entries(message.reactions ?? {}).filter(([, uids]) => uids.length > 0);
          if (activeReactions.length === 0) return null;
          const totalCount = activeReactions.reduce((sum, [, uids]) => sum + uids.length, 0);
          const shown = activeReactions.slice(0, 3);
          return (
            <button
              type="button"
              onClick={() => setReactionsListOpen(true)}
              aria-label="Reaksiyalarni ko'rish"
              className={cn(
                "absolute -bottom-3 z-10 flex items-center rounded-full bg-white py-0.5 pl-1 pr-1.5",
                mine ? "-left-2" : "-right-2",
              )}
            >
              {shown.map(([emoji], i) => (
                <span
                  key={emoji}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-white p-0.5"
                  style={{ marginLeft: i === 0 ? 0 : -6 }}
                >
                  <Emoji emoji={emoji} />
                </span>
              ))}
              {totalCount > 1 && (
                <span className="ml-1 text-[11px] font-medium text-[#55536e] tabular-nums">{totalCount}</span>
              )}
            </button>
          );
        })()}

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
            selected ? "border-white bg-white text-black" : "border-border",
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
