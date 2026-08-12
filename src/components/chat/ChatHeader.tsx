"use client";

import { useEffect, useState } from "react";
import { IoCall, IoPersonCircleOutline } from "react-icons/io5";
import { Avatar } from "@/components/ui/Avatar";
import { BackButton } from "@/components/chat/BackButton";
import { ChatDetailsPanel } from "@/components/chat/ChatDetailsPanel";
import { PinnedMessageBar } from "@/components/chat/PinnedMessageBar";
import { OnlineDot } from "@/components/presence/OnlineDot";
import { TypingWave } from "@/components/presence/TypingWave";
import { otherParticipantId, useChatDisplay } from "@/hooks/useChatDisplay";
import { isTypingEntryFresh } from "@/hooks/useTypingStatus";
import { formatLastSeen } from "@/lib/utils/formatTime";
import { useCallStore } from "@/store/useCallStore";
import { useModalStore } from "@/store/useModalStore";
import type { Chat } from "@/types/chat";
import type { CallType } from "@/types/call";
import type { UserProfile } from "@/types/user";

interface ChatHeaderProps {
  chat: Chat;
  uid: string;
  participantProfiles: Record<string, UserProfile>;
}

function GlassButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/12 text-[#2A2A35] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function ChatHeader({ chat, uid, participantProfiles }: ChatHeaderProps) {
  const { name, photoURL, presence } = useChatDisplay(chat, uid);
  const setGroupSettingsChatId = useModalStore((s) => s.setGroupSettingsChatId);
  const startCall = useCallStore((s) => s.startCall);
  const startGroupCall = useCallStore((s) => s.startGroupCall);
  const callPhase = useCallStore((s) => s.phase);
  const [, forceTick] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const peerId = chat.type === "direct" ? otherParticipantId(chat, uid) : null;

  function handleStartCall(type: CallType) {
    if (callPhase !== "idle") return;
    if (chat.type === "group") {
      void startGroupCall(chat.id, uid, chat.participantIds, type);
    } else if (peerId) {
      void startCall(chat.id, uid, peerId, type);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const typingEntries = Object.entries(chat.typingStatus ?? {}).filter(
    ([id, entry]) => id !== uid && entry.updatedAt && isTypingEntryFresh(entry.updatedAt.toMillis()),
  );

  let subtitle: React.ReactNode;
  if (typingEntries.length > 0) {
    const variant = typingEntries[0][1].type;
    if (chat.type === "group") {
      const names = typingEntries.map(([id]) => participantProfiles[id]?.displayName?.split(" ")[0] ?? "kimdir");
      subtitle = (
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-[#2A2A35]/60">
          <span className="truncate">{names.join(", ")}</span>
          <TypingWave variant={variant} />
        </span>
      );
    } else {
      subtitle = (
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-[#2A2A35]/60">
          <span className="truncate">{variant === "voice" ? "ovozli xabar yozmoqda" : "yozmoqda"}</span>
          <TypingWave variant={variant} />
        </span>
      );
    }
  } else if (chat.type === "group") {
    subtitle = <span className="block truncate text-xs text-[#2A2A35]/60">{chat.participantIds.length} a&apos;zo</span>;
  } else {
    subtitle = (
      <span className="block truncate text-xs text-[#2A2A35]/60">
        {presence.online ? "onlayn" : formatLastSeen(presence.lastSeen)}
      </span>
    );
  }

  function openDetails() {
    if (chat.type === "group") setGroupSettingsChatId(chat.id);
    else setDetailsOpen(true);
  }

  return (
    <div
      className="sticky top-0 z-20"
      style={{ background: "transparent", backdropFilter: "blur(20px)", border: "none", boxShadow: "none" }}
    >
      <div
        className="flex items-center gap-3 px-5 py-2.5"
        style={{ paddingTop: "calc(var(--safe-top) + 0.625rem)" }}
      >
        <BackButton />
        <button type="button" onClick={openDetails} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className="relative shrink-0">
            <Avatar name={name} photoURL={photoURL} size="header" />
            {chat.type === "direct" && (
              <OnlineDot online={presence.online} className="absolute -bottom-0.5 -right-0.5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="line-clamp-2 text-[15px] font-semibold text-[#2A2A35]">{name}</div>
            {subtitle}
          </div>
        </button>
        <GlassButton label="Qo'ng'iroq" disabled={callPhase !== "idle"} onClick={() => handleStartCall("audio")}>
          <IoCall className="h-3.75 w-3.75" />
        </GlassButton>
        <GlassButton label="Profil" onClick={openDetails}>
          <IoPersonCircleOutline className="h-3.75 w-3.75" />
        </GlassButton>
      </div>
      {chat.pinnedMessageId && (
        <PinnedMessageBar
          chatId={chat.id}
          messageId={chat.pinnedMessageId}
          canUnpin={chat.type === "direct" || chat.adminIds.includes(uid)}
        />
      )}
      <ChatDetailsPanel chat={chat} uid={uid} open={detailsOpen} onClose={() => setDetailsOpen(false)} />
    </div>
  );
}
