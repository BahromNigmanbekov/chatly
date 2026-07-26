"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { BackButton } from "@/components/chat/BackButton";
import { OnlineDot } from "@/components/presence/OnlineDot";
import { TypingWave } from "@/components/presence/TypingWave";
import { useChatDisplay } from "@/hooks/useChatDisplay";
import { isTypingEntryFresh } from "@/hooks/useTypingStatus";
import { formatLastSeen } from "@/lib/utils/formatTime";
import type { Chat } from "@/types/chat";
import type { UserProfile } from "@/types/user";

interface ChatHeaderProps {
  chat: Chat;
  uid: string;
  participantProfiles: Record<string, UserProfile>;
}

export function ChatHeader({ chat, uid, participantProfiles }: ChatHeaderProps) {
  const { name, photoURL, presence } = useChatDisplay(chat, uid);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const typingEntries = Object.entries(chat.typingStatus ?? {}).filter(
    ([id, entry]) => id !== uid && entry.updatedAt && isTypingEntryFresh(entry.updatedAt.toMillis()),
  );

  const href = chat.type === "group" ? `/groups/${chat.id}` : undefined;

  let subtitle: React.ReactNode;
  if (typingEntries.length > 0) {
    const variant = typingEntries[0][1].type;
    if (chat.type === "group") {
      const names = typingEntries.map(([id]) => participantProfiles[id]?.displayName?.split(" ")[0] ?? "kimdir");
      subtitle = (
        <span className="flex items-center gap-1.5 text-xs">
          <span>{names.join(", ")}</span>
          <TypingWave variant={variant} />
        </span>
      );
    } else {
      subtitle = (
        <span className="flex items-center gap-1.5 text-xs">
          <span>{variant === "voice" ? "ovozli xabar yozmoqda" : "yozmoqda"}</span>
          <TypingWave variant={variant} />
        </span>
      );
    }
  } else if (chat.type === "group") {
    subtitle = <span className="text-xs text-text-muted">{chat.participantIds.length} a&apos;zo</span>;
  } else {
    subtitle = (
      <span className="text-xs text-text-muted">
        {presence.online ? "onlayn" : formatLastSeen(presence.lastSeen)}
      </span>
    );
  }

  const content = (
    <div className="flex items-center gap-3 px-1 py-1">
      <div className="relative shrink-0">
        <Avatar name={name} photoURL={photoURL} size="md" />
        {chat.type === "direct" && (
          <OnlineDot online={presence.online} className="absolute -bottom-0.5 -right-0.5" />
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate font-medium text-text">{name}</div>
        {subtitle}
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
      <BackButton />
      {href ? (
        <Link href={href} className="min-w-0 flex-1 rounded-lg hover:bg-primary-soft">
          {content}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{content}</div>
      )}
    </div>
  );
}
