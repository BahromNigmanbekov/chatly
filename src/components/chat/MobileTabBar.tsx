"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMessageCircle } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils/cn";

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
        <FiMessageCircle className="h-6 w-6" aria-hidden />
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
