"use client";

import { FiEdit2 } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";

/** Just your own profile card — app preferences and account actions live in Sozlamalar instead. */
export default function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const setEditProfileOpen = useModalStore((s) => s.setEditProfileOpen);

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3.5 text-center">
        <span className="font-display text-lg font-semibold text-text">Profil</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto px-4 py-10">
        <Avatar name={profile.displayName} photoURL={profile.photoURL} size="xl" ring />
        <div className="text-center">
          <div className="text-lg font-semibold text-text">{profile.displayName}</div>
          <div className="text-sm text-text-muted">@{profile.username}</div>
        </div>
        {profile.bio && <p className="max-w-xs text-center text-sm text-text">{profile.bio}</p>}

        <Button size="lg" onClick={() => setEditProfileOpen(true)} className="mt-2">
          <FiEdit2 className="h-4 w-4" />
          Tahrirlash
        </Button>
      </div>
    </div>
  );
}
