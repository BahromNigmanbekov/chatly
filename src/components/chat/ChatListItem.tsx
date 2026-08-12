"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { TbPinFilled } from "react-icons/tb";
import { Avatar } from "@/components/ui/Avatar";
import { EmojiText } from "@/components/ui/Emoji";
import { MessageContextMenu, type MessageMenuItem } from "@/components/chat/MessageContextMenu";
import { ReadStatusTicks } from "@/components/chat/ReadStatusTicks";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatDisplay } from "@/hooks/useChatDisplay";
import { toggleChatPin } from "@/lib/firebase/chats";
import { formatMessageTime } from "@/lib/utils/formatTime";
import { cn } from "@/lib/utils/cn";
import type { Chat } from "@/types/chat";

const TYPE_PREVIEW: Record<string, string> = {
  voice: "🎤 Ovozli xabar",
  image: "📷 Rasm",
  video: "🎬 Video",
  system: "",
};

const LONG_PRESS_MS = 450;

export function ChatListItem({ chat }: { chat: Chat }) {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const pathname = usePathname();
  const { name, photoURL, presence } = useChatDisplay(chat, uid ?? "");
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!uid) return null;

  const isActive = pathname === `/chats/${chat.id}`;
  const isPinned = (chat.pinnedBy ?? []).includes(uid);
  const unread = chat.unreadCounts?.[uid] ?? 0;
  const preview = chat.lastMessage
    ? TYPE_PREVIEW[chat.lastMessage.type] || chat.lastMessage.text
    : "Hali xabar yo'q";
  const isMine = chat.lastMessage?.senderId === uid;

  const menuItems: MessageMenuItem[] = [
    {
      label: isPinned ? "Mahkamlashni bekor qilish" : "Ro'yxat boshiga mahkamlash",
      onSelect: () => void toggleChatPin(chat.id, uid, !isPinned),
    },
  ];

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setMenuAnchor({ x: e.clientX, y: e.clientY });
  }

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    pressTimer.current = setTimeout(() => setMenuAnchor({ x: touch.clientX, y: touch.clientY }), LONG_PRESS_MS);
  }

  function clearPressTimer() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  return (
    <div className={cn("relative flex min-h-19 items-center rounded-2xl", isActive && "bg-white/5")}>
      <Link
        href={`/chats/${chat.id}`}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={clearPressTimer}
        onTouchMove={clearPressTimer}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2 hover:bg-white/5"
      >
        <div className="relative shrink-0">
          <Avatar name={name} photoURL={photoURL} size="lg" />
          {chat.type === "direct" && presence.online && (
            <span
              className="absolute right-0 bottom-0 rounded-full bg-online"
              style={{ width: 13, height: 13, border: "2.5px solid #000000" }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-base font-semibold text-white">{name}</span>
            <span className="flex shrink-0 items-center gap-1 text-xs text-[#8e8e93]">
              {isPinned && <TbPinFilled className="h-3 w-3 text-white/60" aria-label="Mahkamlangan" />}
              {chat.lastMessage?.timestamp && formatMessageTime(chat.lastMessage.timestamp)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1 truncate text-[13.5px] text-[#8e8e93]">
              {isMine && chat.lastMessage && (
                <ReadStatusTicks status={chat.lastMessage.status ?? "sent"} tone="muted" />
              )}
              <span className="truncate"><EmojiText text={preview} /></span>
            </span>
            {unread > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-white px-1.5 text-xs font-semibold text-black">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>
        </div>
      </Link>

      <MessageContextMenu anchor={menuAnchor} items={menuItems} onClose={() => setMenuAnchor(null)} />
    </div>
  );
}
