"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { ProfileMenuRow } from "@/components/profile/ProfileMenuRow";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";
import { useUIStore } from "@/store/useUIStore";
import { useToastStore } from "@/store/useToastStore";
import { logoutUser } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d={path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const setEditProfileOpen = useModalStore((s) => s.setEditProfileOpen);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
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
        <span className="font-display text-lg font-semibold text-text">Profil</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col items-center gap-2 py-8">
          <Avatar name={profile.displayName} photoURL={profile.photoURL} size="xl" />
          <div className="text-center">
            <div className="text-lg font-semibold text-text">{profile.displayName}</div>
            <div className="text-sm text-text-muted">@{profile.username}</div>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-4 pb-10">
        <div>
          <div className="px-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Hisob</div>
          <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
            <ProfileMenuRow
              icon={<Icon path="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />}
              label="Profilni boshqarish"
              onClick={() => setEditProfileOpen(true)}
            />
            <ProfileMenuRow
              icon={<Icon path="M6 11V8a6 6 0 1112 0v3M5 11h14v9H5v-9z" />}
              label="Parol va xavfsizlik"
              onClick={comingSoon}
            />
            <ProfileMenuRow
              icon={<Icon path="M12 3a5 5 0 00-5 5v3.5c0 .9-.4 1.7-1 2.3L5 15h14l-1-1.2c-.6-.6-1-1.4-1-2.3V8a5 5 0 00-5-5zM9.5 18a2.5 2.5 0 005 0" />}
              label="Bildirishnomalar"
              onClick={comingSoon}
            />
          </div>
        </div>

        <div>
          <div className="px-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Ilova</div>
          <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
            <ProfileMenuRow
              icon={<Icon path="M20 14.5A8.5 8.5 0 119.5 4a6.8 6.8 0 0010.5 10.5z" />}
              label="Mavzu"
              trailing={theme === "dark" ? "Qorong'i" : "Yorug'"}
              onClick={toggleTheme}
            />
            <ProfileMenuRow
              icon={<Icon path="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />}
              label="Til"
              trailing="O'zbekcha"
              onClick={comingSoon}
            />
            <ProfileMenuRow
              icon={<Icon path="M9.5 9a2.5 2.5 0 015 0c0 1.5-2 1.8-2.4 3.2M12 17v.01M12 21a9 9 0 100-18 9 9 0 000 18z" />}
              label="Yordam markazi"
              onClick={comingSoon}
            />
            <ProfileMenuRow
              icon={<Icon path="M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7v.01" />}
              label="Biz haqimizda"
              onClick={comingSoon}
            />
          </div>
        </div>

          <div className="flex flex-col rounded-2xl border border-border bg-surface">
            <ProfileMenuRow
              icon={<Icon path="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />}
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
