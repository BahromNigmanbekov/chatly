"use client";

import { Modal } from "@/components/ui/Modal";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";

export function EditProfileModal() {
  const open = useModalStore((s) => s.editProfileOpen);
  const setOpen = useModalStore((s) => s.setEditProfileOpen);
  const profile = useAuthStore((s) => s.profile);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Profilni tahrirlash">
      {profile && (
        <div className="flex flex-col items-center gap-6 px-4 py-6">
          <AvatarUploader uid={profile.uid} name={profile.displayName} photoURL={profile.photoURL} />
          <ProfileForm profile={profile} onSaved={() => setOpen(false)} />
        </div>
      )}
    </Modal>
  );
}
