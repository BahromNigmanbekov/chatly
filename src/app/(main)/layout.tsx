"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { MobileTabBar } from "@/components/chat/MobileTabBar";
import { Sidebar } from "@/components/chat/Sidebar";
import { CallProvider } from "@/components/calls/CallProvider";
import { ModalHost } from "@/components/ModalHost";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils/cn";

export default function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const initializing = useAuthStore((s) => s.initializing);

  useEffect(() => {
    if (!initializing && !firebaseUser) router.replace("/login");
  }, [initializing, firebaseUser, router]);

  if (initializing || !firebaseUser) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // On mobile, exactly one pane is visible at a time: the chat list only at
  // "/", everything else (open chat, profile, search, group flows) takes the
  // full screen. Desktop always shows both panes side by side.
  const isHome = pathname === "/";
  const showTabBar = pathname === "/" || pathname === "/profile";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "w-full shrink-0 flex-col border-border bg-surface md:flex md:w-95 md:border-r",
            isHome ? "flex" : "hidden",
          )}
        >
          <Sidebar />
        </aside>
        <main
          className={cn(
            "min-h-0 min-w-0 flex-1 flex-col bg-bg md:flex",
            isHome ? "hidden" : "flex",
          )}
        >
          {children}
        </main>
      </div>
      {showTabBar && <MobileTabBar />}
      <ModalHost />
      <CallProvider />
    </div>
  );
}
