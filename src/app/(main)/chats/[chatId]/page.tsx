"use client";

import { use } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useChatDoc } from "@/hooks/useChatDoc";
import { useAuthStore } from "@/store/useAuthStore";

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
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

  if (!chat || !uid || !chat.participantIds.includes(uid)) {
    return <EmptyState title="Suhbat topilmadi" description="Bu suhbat mavjud emas yoki sizda kirish huquqi yo'q." />;
  }

  return <ChatWindow chat={chat} uid={uid} />;
}
