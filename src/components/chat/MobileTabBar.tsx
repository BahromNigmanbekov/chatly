"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMessageCircle, FiSettings, FiUsers } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { useChats } from "@/hooks/useChats";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils/cn";

function TabLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium",
        active ? "text-tab-active" : "text-text-muted",
      )}
      aria-current={active ? "page" : undefined}
    >
      {children}
      {label}
    </Link>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const profile = useAuthStore((s) => s.profile);
  const { chats } = useChats(uid);
  const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCounts?.[uid ?? ""] ?? 0), 0);
  const isChats = pathname === "/" || pathname.startsWith("/chats/");
  const isContacts = pathname === "/contacts";
  const isSettings = pathname === "/settings";
  const isProfile = pathname === "/profile";

  return (
    <nav
      className="flex shrink-0 items-stretch border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="Asosiy navigatsiya"
    >
      <TabLink href="/" label="Chatlar" active={isChats}>
        <span className="relative">
          <FiMessageCircle className="h-6 w-6" aria-hidden />
          {totalUnread > 0 && (
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-black">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </span>
      </TabLink>

      <TabLink href="/contacts" label="Kontaktlar" active={isContacts}>
        <FiUsers className="h-6 w-6" aria-hidden />
      </TabLink>

      <TabLink href="/settings" label="Sozlamalar" active={isSettings}>
        <FiSettings className="h-6 w-6" aria-hidden />
      </TabLink>

      <TabLink href="/profile" label="Profil" active={isProfile}>
        <Avatar
          name={profile?.displayName ?? "?"}
          photoURL={profile?.photoURL}
          size="sm"
          className={cn(isProfile && "ring-2 ring-tab-active")}
        />
      </TabLink>
    </nav>
  );
}
