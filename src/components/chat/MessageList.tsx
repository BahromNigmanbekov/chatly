"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Spinner } from "@/components/ui/Spinner";
import { useMessages } from "@/hooks/useMessages";
import { markMessagesDelivered, markMessagesRead } from "@/lib/firebase/messages";
import type { Chat } from "@/types/chat";

interface MessageListProps {
  chat: Chat;
  uid: string;
  senderNames?: Record<string, string>;
}

export function MessageList({ chat, uid, senderNames }: MessageListProps) {
  const { messages, loading, loadMore, hasMore, loadingMore } = useMessages(chat.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (messages.length === 0) return;
    void markMessagesDelivered(chat, uid, messages);
    void markMessagesRead(chat, uid, messages);
  }, [chat, uid, messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const grew = messages.length > prevCountRef.current;
    prevCountRef.current = messages.length;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (grew && nearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Jump to bottom on first load of a chat.
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.id, loading]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || !hasMore || loadingMore) return;
    if (el.scrollTop < 80) {
      const prevHeight = el.scrollHeight;
      void loadMore().then(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
          }
        });
      });
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4 sm:px-6">
      {loadingMore && (
        <div className="flex justify-center py-2">
          <Spinner className="h-4 w-4" />
        </div>
      )}
      {messages.length === 0 && (
        <p className="mt-auto text-center text-sm text-text-muted">
          Birinchi xabarni yuboring 👋
        </p>
      )}
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          mine={message.senderId === uid}
          chatId={chat.id}
          uid={uid}
          senderName={chat.type === "group" ? senderNames?.[message.senderId] : undefined}
        />
      ))}
    </div>
  );
}
