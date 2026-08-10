"use client";

import { useEffect, useState } from "react";
import { FiInfo, FiPhone, FiVideo } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { BackButton } from "@/components/chat/BackButton";
import { ChatDetailsPanel } from "@/components/chat/ChatDetailsPanel";
import { PinnedMessageBar } from "@/components/chat/PinnedMessageBar";
import { OnlineDot } from "@/components/presence/OnlineDot";
import { TypingWave } from "@/components/presence/TypingWave";
import { UserProfileModal } from "@/components/profile/UserProfileModal";
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

function CallButton({ kind, disabled, onClick }: { kind: "audio" | "video"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={kind === "audio" ? "Ovozli qo'ng'iroq" : "Video qo'ng'iroq"}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-raised disabled:opacity-40"
    >
      {kind === "audio" ? <FiPhone className="h-5 w-5" /> : <FiVideo className="h-5 w-5" />}
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
  const [viewProfileUid, setViewProfileUid] = useState<string | null>(null);

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

  const info = (
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
    <div>
      <div
        className="flex items-center gap-2 border-b border-border px-3 py-2.5"
        style={{ paddingTop: "calc(var(--safe-top) + 0.625rem)" }}
      >
        <BackButton />
        {chat.type === "group" ? (
          <button
            type="button"
            onClick={() => setGroupSettingsChatId(chat.id)}
            className="min-w-0 flex-1 rounded-lg text-left hover:bg-surface-raised"
          >
            {info}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setViewProfileUid(peerId)}
            className="min-w-0 flex-1 rounded-lg text-left hover:bg-surface-raised"
          >
            {info}
          </button>
        )}
        {chat.type === "group" && (
          <div className="hidden -space-x-2.5 sm:flex" aria-hidden>
            {chat.participantIds.slice(0, 4).map((id) => {
              const member = participantProfiles[id];
              if (!member) return null;
              return <Avatar key={id} name={member.displayName} photoURL={member.photoURL} size="sm" ring className="ring-2 ring-surface" />;
            })}
            {chat.participantIds.length > 4 && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-xs font-semibold text-text-muted ring-2 ring-surface">
                +{chat.participantIds.length - 4}
              </span>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          aria-label="Suhbat ma'lumoti"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-raised lg:hidden"
        >
          <FiInfo className="h-5 w-5" />
        </button>
        <CallButton kind="audio" disabled={callPhase !== "idle"} onClick={() => handleStartCall("audio")} />
        <CallButton kind="video" disabled={callPhase !== "idle"} onClick={() => handleStartCall("video")} />
      </div>
      {chat.pinnedMessageId && (
        <PinnedMessageBar
          chatId={chat.id}
          messageId={chat.pinnedMessageId}
          canUnpin={chat.type === "direct" || chat.adminIds.includes(uid)}
        />
      )}
      <ChatDetailsPanel chat={chat} uid={uid} open={detailsOpen} onClose={() => setDetailsOpen(false)} />
      <UserProfileModal uid={viewProfileUid} open={viewProfileUid !== null} onClose={() => setViewProfileUid(null)} />
    </div>
  );
}
