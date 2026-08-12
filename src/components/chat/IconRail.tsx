"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiLogOut, FiMenu, FiMessageCircle, FiPlus, FiSettings, FiUsers } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { logoutUser } from "@/lib/firebase/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";
import { cn } from "@/lib/utils/cn";

/** Persistent narrow left-most rail on desktop — chat list/header keep their own icons on mobile, where this is hidden in favor of MobileTabBar. */
export function IconRail() {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const setGroupCreateOpen = useModalStore((s) => s.setGroupCreateOpen);
  const isChats = pathname === "/" || pathname.startsWith("/chats/");
  const isProfile = pathname === "/profile";
  const isMenuSection = pathname === "/contacts" || pathname === "/settings";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logoutUser();
    router.push("/login");
  }

  return (
    <nav
      className="hidden w-18 shrink-0 flex-col items-center gap-2 bg-bg py-4 md:flex"
      style={{ paddingTop: "calc(var(--safe-top) + 1rem)", paddingBottom: "calc(var(--safe-bottom) + 1rem)" }}
      aria-label="Asosiy navigatsiya"
    >
      <div
        className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl font-display text-base font-bold text-white"
        style={{ backgroundImage: "var(--gradient-brand)" }}
      >
        G
      </div>

      <button
        type="button"
        onClick={() => router.push("/")}
        aria-label="Suhbatlar"
        aria-current={isChats ? "page" : undefined}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl transition-colors",
          isChats ? "bg-white text-black" : "text-white/50 hover:bg-white/10 hover:text-white",
        )}
      >
        <FiMessageCircle className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => setGroupCreateOpen(true)}
        aria-label="Yangi guruh yaratish"
        className="flex h-11 w-11 items-center justify-center rounded-2xl text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      >
        <FiPlus className="h-5 w-5" aria-hidden />
      </button>

      <div className="relative mt-auto flex flex-col items-center gap-3">
        {menuOpen && (
          <div
            ref={menuRef}
            role="menu"
            className="chatly-dialog-enter absolute bottom-0 left-full z-50 ml-2 min-w-47.5 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                router.push("/contacts");
                setMenuOpen(false);
              }}
              className="flex min-h-10 w-full items-center gap-2.5 px-3.5 text-left text-sm text-text hover:bg-surface-raised"
            >
              <FiUsers className="h-4 w-4" aria-hidden /> Kontaktlar
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                router.push("/settings");
                setMenuOpen(false);
              }}
              className="flex min-h-10 w-full items-center gap-2.5 px-3.5 text-left text-sm text-text hover:bg-surface-raised"
            >
              <FiSettings className="h-4 w-4" aria-hidden /> Sozlamalar
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex min-h-10 w-full items-center gap-2.5 px-3.5 text-left text-sm text-danger hover:bg-surface-raised"
            >
              <FiLogOut className="h-4 w-4" aria-hidden /> Chiqish
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menyu"
          aria-current={isMenuSection ? "page" : undefined}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl transition-colors",
            isMenuSection || menuOpen ? "bg-white text-black" : "text-white/50 hover:bg-white/10 hover:text-white",
          )}
        >
          <FiMenu className="h-5 w-5" aria-hidden />
        </button>
        <Link
          href="/profile"
          aria-label="Profil"
          className={cn("rounded-full ring-2 ring-offset-2 ring-offset-bg", isProfile ? "ring-white" : "ring-transparent")}
        >
          <Avatar name={profile?.displayName ?? "?"} photoURL={profile?.photoURL} size="sm" />
        </Link>
      </div>
    </nav>
  );
}
