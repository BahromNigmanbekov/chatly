"use client";

import { use } from "react";
import { BackButton } from "@/components/chat/BackButton";
import { GroupInfoPanel } from "@/components/groups/GroupInfoPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useChatDoc } from "@/hooks/useChatDoc";
import { useAuthStore } from "@/store/useAuthStore";

export default function GroupInfoPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const { chat, loading } = useChatDoc(chatId);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!chat || !uid || chat.type !== "group" || !chat.participantIds.includes(uid)) {
    return <EmptyState title="Guruh topilmadi" description="Bu guruh mavjud emas yoki sizda kirish huquqi yo'q." />;
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
        <BackButton href={`/chats/${chatId}`} />
        <span className="font-display text-lg font-semibold text-text">Guruh haqida</span>
      </div>
      <GroupInfoPanel chat={chat} uid={uid} />
    </div>
  );
}
