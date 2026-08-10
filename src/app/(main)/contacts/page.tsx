"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { UserProfileModal } from "@/components/profile/UserProfileModal";
import { OnlineDot } from "@/components/presence/OnlineDot";
import { usePresence } from "@/hooks/usePresence";
import { useChats } from "@/hooks/useChats";
import { otherParticipantId } from "@/hooks/useChatDisplay";
import { useParticipantProfiles } from "@/hooks/useParticipantProfiles";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserProfile } from "@/types/user";

function ContactRow({ profile, onClick }: { profile: UserProfile; onClick: () => void }) {
  const presence = usePresence(profile.uid);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-surface-raised"
    >
      <div className="relative shrink-0">
        <Avatar name={profile.displayName} photoURL={profile.photoURL} size="lg" ring />
        <OnlineDot online={presence.online} className="absolute -bottom-0.5 -right-0.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display font-semibold text-text">{profile.displayName}</div>
        <div className="truncate text-sm text-text-muted">@{profile.username}</div>
      </div>
    </button>
  );
}

/** Everyone you have a 1:1 chat with — a flat, alphabetical contact list (not activity-sorted like the chat list). */
export default function ContactsPage() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const { chats, loading } = useChats(uid);
  const [viewProfileUid, setViewProfileUid] = useState<string | null>(null);

  const peerIds = useMemo(() => {
    const ids = chats
      .filter((c) => c.type === "direct")
      .map((c) => otherParticipantId(c, uid ?? ""))
      .filter((id): id is string => Boolean(id));
    return Array.from(new Set(ids));
  }, [chats, uid]);

  const profiles = useParticipantProfiles(peerIds);
  const contacts = peerIds
    .map((id) => profiles[id])
    .filter((p): p is UserProfile => Boolean(p))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3.5 text-center">
        <span className="font-display text-lg font-semibold text-text">Kontaktlar</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2">
        {contacts.length === 0 ? (
          <EmptyState
            title="Hali kontaktlar yo'q"
            description="Suhbatlar bo'limida @username orqali odam qidiring."
          />
        ) : (
          contacts.map((profile) => (
            <ContactRow key={profile.uid} profile={profile} onClick={() => setViewProfileUid(profile.uid)} />
          ))
        )}
      </div>

      <UserProfileModal uid={viewProfileUid} open={viewProfileUid !== null} onClose={() => setViewProfileUid(null)} />
    </div>
  );
}
