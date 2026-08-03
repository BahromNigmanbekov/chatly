"use client";

import { FiPhone, FiPhoneOff } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { useChatDoc } from "@/hooks/useChatDoc";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useCallStore } from "@/store/useCallStore";

export function IncomingCallScreen() {
  const call = useCallStore((s) => s.incomingCall);
  const acceptIncomingCall = useCallStore((s) => s.acceptIncomingCall);
  const declineIncomingCall = useCallStore((s) => s.declineIncomingCall);
  const { profile } = useUserProfile(call?.isGroup ? undefined : call?.callerId);
  const { chat } = useChatDoc(call?.isGroup ? call.chatId : undefined);

  if (!call) return null;

  const name = call.isGroup ? (chat?.groupName ?? "Guruh qo'ng'irog'i") : (profile?.displayName ?? "...");
  const photoURL = call.isGroup ? (chat?.groupPhotoURL ?? null) : (profile?.photoURL ?? null);
  const subtitle = call.isGroup
    ? "Guruh qo'ng'irog'i boshlandi — qo'shilasizmi?"
    : call.type === "video"
      ? "Video qo'ng'iroq qilmoqda..."
      : "Ovozli qo'ng'iroq qilmoqda...";

  return (
    <div className="chatly-overlay-enter fixed inset-0 z-[70] flex flex-col items-center justify-between bg-bg px-6 py-16 text-text">
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Avatar name={name} photoURL={photoURL} size="xl" />
        <div className="text-center">
          <div className="text-xl font-semibold">{name}</div>
          <div className="mt-1 text-sm text-text-muted">{subtitle}</div>
        </div>
      </div>

      <div className="flex w-full max-w-xs items-center justify-between gap-6 pb-[var(--safe-bottom)]">
        <button
          type="button"
          onClick={() => declineIncomingCall()}
          aria-label="Rad etish"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-danger text-white shadow-lg"
        >
          <FiPhoneOff className="h-7 w-7" />
        </button>

        <button
          type="button"
          onClick={() => acceptIncomingCall()}
          aria-label="Qabul qilish"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-online text-white shadow-lg"
        >
          <FiPhone className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}
