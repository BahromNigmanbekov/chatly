"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/chat/Sidebar";
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

  const isChatOpen = pathname.startsWith("/chats/");

  return (
    <div className="flex min-h-0 flex-1">
      <aside
        className={cn(
          "w-full shrink-0 border-border bg-surface md:flex md:w-[380px] md:border-r",
          isChatOpen ? "hidden" : "flex flex-col",
        )}
      >
        <Sidebar />
      </aside>
      <main
        className={cn(
          "min-h-0 min-w-0 flex-1 bg-bg",
          isChatOpen ? "flex flex-col" : "hidden md:flex md:flex-col",
        )}
      >
        {children}
      </main>
    </div>
  );
}
