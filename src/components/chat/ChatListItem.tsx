"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { OnlineDot } from "@/components/presence/OnlineDot";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatDisplay } from "@/hooks/useChatDisplay";
import { formatMessageTime } from "@/lib/utils/formatTime";
import { cn } from "@/lib/utils/cn";
import type { Chat } from "@/types/chat";

const TYPE_PREVIEW: Record<string, string> = {
  voice: "🎤 Ovozli xabar",
  image: "📷 Rasm",
  video: "🎬 Video",
  system: "",
};

export function ChatListItem({ chat }: { chat: Chat }) {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const pathname = usePathname();
  const { name, photoURL, presence } = useChatDisplay(chat, uid ?? "");

  if (!uid) return null;

  const isActive = pathname === `/chats/${chat.id}`;
  const unread = chat.unreadCounts?.[uid] ?? 0;
  const preview = chat.lastMessage
    ? TYPE_PREVIEW[chat.lastMessage.type] || chat.lastMessage.text
    : "Hali xabar yo'q";
  const isMine = chat.lastMessage?.senderId === uid;

  return (
    <Link
      href={`/chats/${chat.id}`}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-primary-soft",
        isActive && "bg-primary-soft",
      )}
    >
      <div className="relative shrink-0">
        <Avatar name={name} photoURL={photoURL} size="md" />
        {chat.type === "direct" && (
          <OnlineDot online={presence.online} className="absolute -bottom-0.5 -right-0.5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium text-text">{name}</span>
          {chat.lastMessage?.timestamp && (
            <span className="shrink-0 text-xs text-text-muted">
              {formatMessageTime(chat.lastMessage.timestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm text-text-muted">
            {isMine && chat.lastMessage ? "Siz: " : ""}
            {preview}
          </span>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
