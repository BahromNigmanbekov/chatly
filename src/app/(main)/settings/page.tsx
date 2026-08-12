"use client";

import { useRouter } from "next/navigation";
import {
  FiBell,
  FiGlobe,
  FiHelpCircle,
  FiInfo,
  FiLock,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { ProfileMenuRow } from "@/components/profile/ProfileMenuRow";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";
import { useToastStore } from "@/store/useToastStore";
import { logoutUser } from "@/lib/firebase/auth";

export default function SettingsPage() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const setEditProfileOpen = useModalStore((s) => s.setEditProfileOpen);
  const showToast = useToastStore((s) => s.show);

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  const comingSoon = () => showToast("Tez orada qo'shiladi");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3.5 text-center">
        <span className="font-display text-lg font-semibold text-text">Sozlamalar</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <button
          type="button"
          onClick={() => setEditProfileOpen(true)}
          className="flex items-center gap-3 border-b border-border px-4 py-4 text-left hover:bg-surface-raised"
        >
          <Avatar name={profile.displayName} photoURL={profile.photoURL} size="lg" ring />
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-text">{profile.displayName}</div>
            <div className="truncate text-sm text-text-muted">@{profile.username}</div>
          </div>
        </button>

        <div className="flex flex-col gap-6 px-4 py-6">
          <div>
            <div className="px-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Hisob</div>
            <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
              <ProfileMenuRow
                icon={<FiUser className="h-4 w-4" />}
                label="Profilni boshqarish"
                onClick={() => setEditProfileOpen(true)}
              />
              <ProfileMenuRow
                icon={<FiLock className="h-4 w-4" />}
                label="Parol va xavfsizlik"
                onClick={comingSoon}
              />
              <ProfileMenuRow
                icon={<FiBell className="h-4 w-4" />}
                label="Bildirishnomalar"
                onClick={comingSoon}
              />
            </div>
          </div>

          <div>
            <div className="px-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Ilova</div>
            <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
              <ProfileMenuRow
                icon={<FiGlobe className="h-4 w-4" />}
                label="Til"
                trailing="O'zbekcha"
                onClick={comingSoon}
              />
              <ProfileMenuRow
                icon={<FiHelpCircle className="h-4 w-4" />}
                label="Yordam markazi"
                onClick={comingSoon}
              />
              <ProfileMenuRow
                icon={<FiInfo className="h-4 w-4" />}
                label="Biz haqimizda"
                onClick={comingSoon}
              />
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-border bg-surface">
            <ProfileMenuRow
              icon={<FiLogOut className="h-4 w-4" />}
              label="Chiqish"
              danger
              onClick={handleLogout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
