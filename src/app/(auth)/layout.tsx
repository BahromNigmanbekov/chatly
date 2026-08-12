"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Spinner } from "@/components/ui/Spinner";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const initializing = useAuthStore((s) => s.initializing);

  useEffect(() => {
    // Gate on `profile` (Firestore), not just `firebaseUser` (Auth). Auth flips
    // to signed-in the instant createUserWithEmailAndPassword resolves — well
    // before the username-claim transaction that follows it has run. Redirecting
    // on the raw auth state would yank a still-registering user off this page
    // (and hide any registration error) before RegisterForm gets a chance to
    // handle success/failure itself.
    if (!initializing && profile) router.replace("/");
  }, [initializing, profile, router]);

  if (initializing) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="gradient-hero flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col items-center gap-1 px-4 pb-8 pt-14 sm:pt-20">
        <span className="font-display text-3xl font-bold text-white">Gap</span>
        <span className="text-sm text-white/80">@username orqali suhbatlashing</span>
      </div>
      <div
        className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center rounded-t-4xl bg-surface px-6 pb-10 pt-8 sm:mb-8 sm:flex-none sm:rounded-4xl sm:pb-8 sm:shadow-2xl"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 2.5rem)" }}
      >
        {children}
      </div>
    </div>
  );
}
