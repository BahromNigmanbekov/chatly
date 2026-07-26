"use client";

import { getDoc } from "firebase/firestore";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";
import { useChats } from "@/hooks/useChats";
import { useChatListNames } from "@/hooks/useChatListNames";
import { userDoc } from "@/lib/firebase/firestore";
import { forwardMessagesTo, getMessageOnce } from "@/lib/firebase/messages";

export function ForwardMessageModal() {
  const router = useRouter();
  const target = useModalStore((s) => s.forwardMessageTarget);
  const setTarget = useModalStore((s) => s.setForwardMessageTarget);
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const { chats } = useChats(uid);
  const names = useChatListNames(chats, uid ?? "");
  const [search, setSearch] = useState("");
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const visibleChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return chats;
    return chats.filter((c) => names[c.id]?.toLowerCase().includes(term));
  }, [chats, names, search]);

  async function handleForward(targetChatId: string, targetParticipantIds: string[]) {
    if (!target || !uid) return;
    setSendingTo(targetChatId);
    try {
      const originals = await Promise.all(
        target.messageIds.map((id) => getMessageOnce(target.chatId, id)),
      );
      const senderIds = Array.from(new Set(originals.filter(Boolean).map((m) => m!.senderId)));
      const senderNames: Record<string, string> = {};
      await Promise.all(
        senderIds.map(async (senderId) => {
          const snap = await getDoc(userDoc(senderId));
          senderNames[senderId] = snap.exists() ? snap.data().displayName : "Kimdir";
        }),
      );

      await forwardMessagesTo({
        originalChatId: target.chatId,
        messageIds: target.messageIds,
        targetChatId,
        targetParticipantIds,
        forwarderUid: uid,
        senderNames,
      });
      setTarget(null);
      router.push(`/chats/${targetChatId}`);
    } finally {
      setSendingTo(null);
    }
  }

  return (
    <Modal open={Boolean(target)} onClose={() => setTarget(null)} title="Uzatish" maxWidthClassName="sm:max-w-sm">
      <div className="flex flex-col gap-3 p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suhbat qidirish"
          className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-text placeholder:text-text-muted focus-visible:border-primary"
        />
        <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
          {visibleChats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              disabled={sendingTo !== null}
              onClick={() => handleForward(chat.id, chat.participantIds)}
              className="flex min-h-14 items-center gap-3 rounded-xl px-2 text-left hover:bg-surface-raised disabled:opacity-50"
            >
              <Avatar name={names[chat.id] || "?"} photoURL={chat.type === "group" ? chat.groupPhotoURL : null} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">{names[chat.id]}</span>
              {sendingTo === chat.id && <Spinner className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
