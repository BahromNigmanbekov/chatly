"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils/cn";

function ChatsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M4 5.5h16a1 1 0 011 1V16a1 1 0 01-1 1H9l-4.5 3.5V17H4a1 1 0 01-1-1V6.5a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const profile = useAuthStore((s) => s.profile);
  const isChats = pathname === "/";
  const isProfile = pathname === "/profile";

  return (
    <nav
      className="flex shrink-0 items-stretch border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="Asosiy navigatsiya"
    >
      <Link
        href="/"
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium",
          isChats ? "text-tab-active" : "text-text-muted",
        )}
        aria-current={isChats ? "page" : undefined}
      >
        <ChatsIcon active={isChats} />
        Suhbatlar
      </Link>
      <Link
        href="/profile"
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium",
          isProfile ? "text-tab-active" : "text-text-muted",
        )}
        aria-current={isProfile ? "page" : undefined}
      >
        <Avatar
          name={profile?.displayName ?? "?"}
          photoURL={profile?.photoURL}
          size="sm"
          className={cn(isProfile && "ring-2 ring-tab-active")}
        />
        Profil
      </Link>
    </nav>
  );
}
