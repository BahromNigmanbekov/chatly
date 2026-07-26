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
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-1">
        <span className="font-display text-2xl font-bold text-primary">Chatly</span>
        <span className="text-sm text-text-muted">@username orqali suhbatlashing</span>
      </div>
      {children}
    </div>
  );
}
