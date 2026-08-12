"use client";

import { useState } from "react";
import { FiImage, FiMic, FiUsers } from "react-icons/fi";
import { HiOutlineVideoCamera } from "react-icons/hi2";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { MediaViewer } from "@/components/chat/MediaViewer";
import { OnlineDot } from "@/components/presence/OnlineDot";
import { UserProfileModal } from "@/components/profile/UserProfileModal";
import { usePresence } from "@/hooks/usePresence";
import { otherParticipantId, useChatDisplay } from "@/hooks/useChatDisplay";
import { useChatMediaOverview } from "@/hooks/useChatMediaOverview";
import { useParticipantProfiles } from "@/hooks/useParticipantProfiles";
import { useCallStore } from "@/store/useCallStore";
import type { Chat } from "@/types/chat";
import type { UserProfile } from "@/types/user";

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl bg-surface-raised px-4 py-3.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">{icon}</span>
      <span className="font-display text-lg font-bold text-text">{value}</span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

function MemberEntry({ profile, onClick }: { profile: UserProfile; onClick: () => void }) {
  const presence = usePresence(profile.uid);
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-surface">
      <div className="relative shrink-0">
        <Avatar name={profile.displayName} photoURL={profile.photoURL} size="sm" ring />
        <OnlineDot online={presence.online} className="absolute -bottom-0.5 -right-0.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-text">{profile.displayName}</div>
        <div className="truncate text-xs text-text-muted">@{profile.username}</div>
      </div>
    </button>
  );
}

/** Shared body — rendered inside a mobile bottom-sheet Modal, and again inside the desktop persistent aside. */
function ChatDetailsBody({ chat, uid }: { chat: Chat; uid: string }) {
  const { name, photoURL } = useChatDisplay(chat, uid);
  const { imageMessages, videoMessages, voiceCount, loading } = useChatMediaOverview(chat.id);
  const memberProfiles = useParticipantProfiles(chat.type === "group" ? chat.participantIds : []);
  const [viewerSrc, setViewerSrc] = useState<{ src: string; type: "image" | "video" } | null>(null);
  const [viewProfileUid, setViewProfileUid] = useState<string | null>(null);
  const startCall = useCallStore((s) => s.startCall);
  const startGroupCall = useCallStore((s) => s.startGroupCall);
  const callPhase = useCallStore((s) => s.phase);
  const mediaItems = [...imageMessages, ...videoMessages].sort(
    (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
  );

  function handleVideoCall() {
    if (callPhase !== "idle") return;
    if (chat.type === "group") {
      void startGroupCall(chat.id, uid, chat.participantIds, "video");
    } else {
      const peerId = otherParticipantId(chat, uid);
      if (peerId) void startCall(chat.id, uid, peerId, "video");
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6 px-4 py-6">
        <div className="flex flex-col items-center gap-2">
          <Avatar name={name} photoURL={photoURL} size="xl" ring />
          <span className="font-display text-lg font-semibold text-text">{name}</span>
          <span className="text-xs text-text-muted">
            {chat.type === "group" ? `${chat.participantIds.length} a'zo` : "Shaxsiy suhbat"}
          </span>
          <button
            type="button"
            onClick={handleVideoCall}
            disabled={callPhase !== "idle"}
            className="mt-1 flex items-center gap-2 rounded-full bg-surface-raised px-4 py-2 text-sm font-medium text-text disabled:opacity-40"
          >
            <HiOutlineVideoCamera className="h-4.5 w-4.5" />
            Video qo&apos;ng&apos;iroq
          </button>
        </div>

        <div className="flex gap-3">
          <StatTile icon={<FiImage className="h-4 w-4" />} label="Media" value={imageMessages.length + videoMessages.length} />
          <StatTile icon={<FiMic className="h-4 w-4" />} label="Ovozli xabar" value={voiceCount} />
          {chat.type === "group" && (
            <StatTile icon={<FiUsers className="h-4 w-4" />} label="A'zolar" value={chat.participantIds.length} />
          )}
        </div>

        {chat.type === "group" && (
          <div>
            <div className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-text-muted">A&apos;zolar</div>
            <div className="flex flex-col divide-y divide-border rounded-2xl bg-surface-raised px-2">
              {chat.participantIds.map((id) =>
                memberProfiles[id] ? (
                  <MemberEntry key={id} profile={memberProfiles[id]} onClick={() => setViewProfileUid(id)} />
                ) : null,
              )}
            </div>
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Media</span>
            {!loading && <span className="text-xs text-text-muted">{mediaItems.length}</span>}
          </div>
          {mediaItems.length === 0 ? (
            <p className="px-1 text-sm text-text-muted">Hali media fayllar yo&apos;q</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {mediaItems.slice(0, 18).map((message) =>
                message.mediaURL ? (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => setViewerSrc({ src: message.mediaURL!, type: message.type === "video" ? "video" : "image" })}
                    className="relative aspect-square overflow-hidden rounded-xl bg-surface-raised"
                  >
                    {message.type === "video" ? (
                      <video src={message.mediaURL} className="h-full w-full object-cover" muted />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={message.mediaURL} alt="" className="h-full w-full object-cover" />
                    )}
                  </button>
                ) : null,
              )}
            </div>
          )}
        </div>
      </div>

      {viewerSrc && <MediaViewer src={viewerSrc.src} type={viewerSrc.type} onClose={() => setViewerSrc(null)} />}
      <UserProfileModal uid={viewProfileUid} open={viewProfileUid !== null} onClose={() => setViewProfileUid(null)} />
    </>
  );
}

/** Bottom-sheet on mobile/tablet, opened via ChatHeader's info button — hidden at the breakpoint where ChatDetailsAside takes over. */
export function ChatDetailsPanel({ chat, uid, open, onClose }: { chat: Chat; uid: string; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Suhbat ma'lumoti" maxWidthClassName="sm:max-w-sm">
      <ChatDetailsBody chat={chat} uid={uid} />
    </Modal>
  );
}

/** Persistent right-hand column, desktop only — always visible alongside an open chat, matching the reference layout. */
export function ChatDetailsAside({ chat, uid }: { chat: Chat; uid: string }) {
  return (
    <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-surface lg:flex">
      <ChatDetailsBody chat={chat} uid={uid} />
    </aside>
  );
}
