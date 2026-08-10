"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiMessageCircle } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { OnlineDot } from "@/components/presence/OnlineDot";
import { usePresence } from "@/hooks/usePresence";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getOrCreateDirectChat } from "@/lib/firebase/chats";
import { formatLastSeen } from "@/lib/utils/formatTime";
import { useAuthStore } from "@/store/useAuthStore";

interface UserProfileModalProps {
  uid: string | null;
  open: boolean;
  onClose: () => void;
}

/** Read-only "view someone's profile" sheet — opened from a chat header avatar, a group member row, or a search result. */
export function UserProfileModal({ uid, open, onClose }: UserProfileModalProps) {
  const router = useRouter();
  const myUid = useAuthStore((s) => s.firebaseUser?.uid);
  const { profile, loading } = useUserProfile(uid);
  const presence = usePresence(uid);
  const [opening, setOpening] = useState(false);

  async function handleMessage() {
    if (!myUid || !uid || opening) return;
    setOpening(true);
    try {
      const chatId = await getOrCreateDirectChat(myUid, uid);
      onClose();
      router.push(`/chats/${chatId}`);
    } finally {
      setOpening(false);
    }
  }

  const isSelf = uid === myUid;

  return (
    <Modal open={open} onClose={onClose} title="Profil" maxWidthClassName="sm:max-w-sm">
      {loading || !profile ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 px-4 py-8">
          <div className="relative">
            <Avatar name={profile.displayName} photoURL={profile.photoURL} size="xl" ring />
            <OnlineDot online={presence.online} className="absolute bottom-1 right-1" />
          </div>
          <div className="text-center">
            <div className="font-display text-lg font-semibold text-text">{profile.displayName}</div>
            <div className="text-sm text-text-muted">@{profile.username}</div>
            <div className="mt-1 text-xs text-text-muted">
              {presence.online ? "onlayn" : formatLastSeen(presence.lastSeen)}
            </div>
          </div>

          {profile.bio && <p className="max-w-xs text-center text-sm text-text">{profile.bio}</p>}

          {!isSelf && (
            <Button size="lg" className="mt-3 w-full justify-center" onClick={handleMessage} disabled={opening}>
              <FiMessageCircle className="h-4 w-4" />
              {opening ? "Ochilmoqda..." : "Xabar yozish"}
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}
