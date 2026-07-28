"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useCallStore } from "@/store/useCallStore";

export function IncomingCallScreen() {
  const call = useCallStore((s) => s.incomingCall);
  const acceptIncomingCall = useCallStore((s) => s.acceptIncomingCall);
  const declineIncomingCall = useCallStore((s) => s.declineIncomingCall);
  const { profile } = useUserProfile(call?.callerId);

  if (!call) return null;

  return (
    <div className="chatly-overlay-enter fixed inset-0 z-[70] flex flex-col items-center justify-between bg-bg px-6 py-16 text-text">
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Avatar name={profile?.displayName ?? "..."} photoURL={profile?.photoURL} size="xl" />
        <div className="text-center">
          <div className="text-xl font-semibold">{profile?.displayName ?? "..."}</div>
          <div className="mt-1 text-sm text-text-muted">
            {call.type === "video" ? "Video qo'ng'iroq qilmoqda..." : "Ovozli qo'ng'iroq qilmoqda..."}
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-xs items-center justify-between gap-6 pb-[var(--safe-bottom)]">
        <button
          type="button"
          onClick={() => declineIncomingCall()}
          aria-label="Rad etish"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-danger text-white shadow-lg"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
            <path
              d="M4.5 15.5c1-3 4-5 7.5-5s6.5 2 7.5 5c.3.9-.2 1.9-1.1 2.1l-2.6.7a1.7 1.7 0 01-1.8-.6l-1-1.3a8 8 0 00-2 0l-1 1.3a1.7 1.7 0 01-1.8.6l-2.6-.7c-.9-.2-1.4-1.2-1.1-2.1z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
              transform="rotate(135 12 12)"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => acceptIncomingCall()}
          aria-label="Qabul qilish"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-online text-white shadow-lg"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
            <path
              d="M4.5 15.5c1-3 4-5 7.5-5s6.5 2 7.5 5c.3.9-.2 1.9-1.1 2.1l-2.6.7a1.7 1.7 0 01-1.8-.6l-1-1.3a8 8 0 00-2 0l-1 1.3a1.7 1.7 0 01-1.8.6l-2.6-.7c-.9-.2-1.4-1.2-1.1-2.1z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
