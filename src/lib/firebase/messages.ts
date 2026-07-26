import {
  arrayUnion,
  deleteField,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { chatDoc, messagesCol } from "@/lib/firebase/firestore";
import type { Chat } from "@/types/chat";
import type { ChatMessage, MessageType } from "@/types/message";

const PREVIEW_TEXT: Record<MessageType, string> = {
  text: "",
  voice: "🎤 Ovozli xabar",
  image: "📷 Rasm",
  video: "🎬 Video",
  system: "",
};

interface SendMessageParams {
  chatId: string;
  senderId: string;
  participantIds: string[];
  type: MessageType;
  content?: string;
  mediaURL?: string;
  duration?: number;
}

export async function sendMessage(params: SendMessageParams): Promise<void> {
  const batch = writeBatch(db);
  const messageRef = doc(messagesCol(params.chatId));

  batch.set(messageRef, {
    id: messageRef.id,
    senderId: params.senderId,
    type: params.type,
    content: params.content ?? null,
    mediaURL: params.mediaURL ?? null,
    duration: params.duration ?? null,
    status: "sent",
    readBy: [params.senderId],
    deletedFor: [],
    createdAt: serverTimestamp(),
  });

  const unreadIncrements: Record<string, ReturnType<typeof increment>> = {};
  for (const id of params.participantIds) {
    if (id !== params.senderId) unreadIncrements[`unreadCounts.${id}`] = increment(1);
  }

  batch.update(chatDoc(params.chatId), {
    lastMessage: {
      messageId: messageRef.id,
      text: params.type === "text" ? (params.content ?? "") : PREVIEW_TEXT[params.type],
      senderId: params.senderId,
      timestamp: serverTimestamp(),
      type: params.type,
      status: "sent",
    },
    [`typingStatus.${params.senderId}`]: deleteField(),
    ...unreadIncrements,
  });

  await batch.commit();
}

export async function markMessagesDelivered(chat: Chat, uid: string, messages: ChatMessage[]) {
  const toUpdate = messages.filter((m) => m.senderId !== uid && m.status === "sent");
  if (toUpdate.length === 0) return;
  const batch = writeBatch(db);
  for (const message of toUpdate) {
    batch.update(doc(messagesCol(chat.id), message.id), { status: "delivered" });
  }
  if (chat.lastMessage && toUpdate.some((m) => m.id === chat.lastMessage?.messageId)) {
    batch.update(chatDoc(chat.id), { "lastMessage.status": "delivered" });
  }
  await batch.commit();
}

export async function markMessagesRead(chat: Chat, uid: string, messages: ChatMessage[]) {
  const toUpdate = messages.filter((m) => m.senderId !== uid && !m.readBy.includes(uid));
  if (toUpdate.length > 0) {
    const batch = writeBatch(db);
    for (const message of toUpdate) {
      batch.update(doc(messagesCol(chat.id), message.id), {
        status: "read",
        readBy: arrayUnion(uid),
      });
    }
    const patch: Record<string, unknown> = { [`unreadCounts.${uid}`]: 0 };
    if (chat.lastMessage && toUpdate.some((m) => m.id === chat.lastMessage?.messageId)) {
      patch["lastMessage.status"] = "read";
    }
    batch.update(chatDoc(chat.id), patch);
    await batch.commit();
  }
}

export async function deleteMessage(
  chatId: string,
  messageId: string,
  uid: string,
  mode: "me" | "everyone",
) {
  const ref = doc(messagesCol(chatId), messageId);
  if (mode === "everyone") {
    const batch = writeBatch(db);
    batch.update(ref, {
      type: "system",
      content: "Xabar o'chirildi",
      mediaURL: null,
    });
    await batch.commit();
  } else {
    await updateDoc(ref, { deletedFor: arrayUnion(uid) });
  }
}
