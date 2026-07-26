"use client";

import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { BackButton } from "@/components/chat/BackButton";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/useAuthStore";

export default function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
        <BackButton />
        <span className="font-display text-lg font-semibold text-text">Profil</span>
      </div>
      <div className="flex flex-1 flex-col items-center gap-6 px-4 py-8">
        <AvatarUploader uid={profile.uid} name={profile.displayName} photoURL={profile.photoURL} />
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
