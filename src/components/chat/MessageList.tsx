"use client";

import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SelectionActionBar } from "@/components/chat/SelectionActionBar";
import { Spinner } from "@/components/ui/Spinner";
import { useMessages } from "@/hooks/useMessages";
import { deleteMessage, markMessagesDelivered, markMessagesRead } from "@/lib/firebase/messages";
import { useModalStore } from "@/store/useModalStore";
import type { Chat } from "@/types/chat";
import type { ChatMessage } from "@/types/message";

interface MessageListProps {
  chat: Chat;
  uid: string;
  senderNames?: Record<string, string>;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
}

export function MessageList({ chat, uid, senderNames, onReply, onEdit }: MessageListProps) {
  const { messages, loading, loadMore, hasMore, loadingMore } = useMessages(chat.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const setForwardMessageTarget = useModalStore((s) => s.setForwardMessageTarget);

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

  useEffect(() => {
    // Leaving the chat exits selection mode so it doesn't linger on return.
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, [chat.id]);

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

  function handleSelectAction(messageId: string) {
    setSelectionMode(true);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }

  function exitSelection() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    await Promise.all(Array.from(selectedIds).map((id) => deleteMessage(chat.id, id, uid, "me")));
    exitSelection();
  }

  function handleBulkForward() {
    setForwardMessageTarget({ chatId: chat.id, messageIds: Array.from(selectedIds) });
    exitSelection();
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
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
            chat={chat}
            uid={uid}
            senderName={senderNames?.[message.senderId]}
            selectionMode={selectionMode}
            selected={selectedIds.has(message.id)}
            onSelectAction={handleSelectAction}
            onReply={onReply}
            onEdit={onEdit}
          />
        ))}
      </div>
      {selectionMode && (
        <SelectionActionBar
          count={selectedIds.size}
          onForward={handleBulkForward}
          onDelete={handleBulkDelete}
          onCancel={exitSelection}
        />
      )}
    </>
  );
}
