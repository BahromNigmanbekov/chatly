import {
  arrayUnion,
  deleteField,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { chatDoc, messagesCol } from "@/lib/firebase/firestore";
import type { Chat } from "@/types/chat";
import type {
  ChatMessage,
  ForwardedFromInfo,
  MessageCard,
  MessageType,
  ReplyPreview,
} from "@/types/message";

const PREVIEW_TEXT: Record<MessageType, string> = {
  text: "",
  voice: "🎤 Ovozli xabar",
  image: "📷 Rasm",
  video: "🎬 Video",
  system: "",
  card: "📋 Karta",
};

interface SendMessageParams {
  chatId: string;
  senderId: string;
  participantIds: string[];
  type: MessageType;
  content?: string;
  mediaURL?: string;
  duration?: number;
  replyTo?: ReplyPreview;
  forwardedFrom?: ForwardedFromInfo;
  card?: MessageCard;
  /** Voice messages only: when the media should be auto-purged. */
  expiresAt?: Timestamp;
  /**
   * Pre-reserved doc ID (via reserveMessageId) — needed when the upload path
   * itself must embed the message ID, e.g. Supabase media paths.
   */
  messageId?: string;
}

/** Reserves a message ID before the doc is written, so upload paths can embed it. */
export function reserveMessageId(chatId: string): string {
  return doc(messagesCol(chatId)).id;
}

export async function sendMessage(params: SendMessageParams): Promise<string> {
  const batch = writeBatch(db);
  const messageRef = params.messageId
    ? doc(messagesCol(params.chatId), params.messageId)
    : doc(messagesCol(params.chatId));

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
    isEdited: false,
    editedAt: null,
    replyTo: params.replyTo ?? null,
    forwardedFrom: params.forwardedFrom ?? null,
    card: params.card ?? null,
    expiresAt: params.expiresAt ?? null,
    voiceExpired: false,
    createdAt: serverTimestamp(),
  });

  const unreadIncrements: Record<string, ReturnType<typeof increment>> = {};
  for (const id of params.participantIds) {
    if (id !== params.senderId) unreadIncrements[`unreadCounts.${id}`] = increment(1);
  }

  batch.update(chatDoc(params.chatId), {
    lastMessage: {
      messageId: messageRef.id,
      text:
        params.type === "text"
          ? (params.content ?? "")
          : params.type === "card"
            ? (params.card?.title ?? PREVIEW_TEXT.card)
            : PREVIEW_TEXT[params.type],
      senderId: params.senderId,
      timestamp: serverTimestamp(),
      type: params.type,
      status: "sent",
    },
    [`typingStatus.${params.senderId}`]: deleteField(),
    ...unreadIncrements,
  });

  await batch.commit();
  return messageRef.id;
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
    await updateDoc(ref, {
      type: "system",
      content: "Xabar o'chirildi",
      mediaURL: null,
    });
  } else {
    await updateDoc(ref, { deletedFor: arrayUnion(uid) });
  }
}

export async function editMessage(chatId: string, messageId: string, newContent: string) {
  await updateDoc(doc(messagesCol(chatId), messageId), {
    content: newContent,
    isEdited: true,
    editedAt: serverTimestamp(),
  });
}

/** Clears the media + flags a voice message as expired (client-side sweep, see useVoiceExpirySweep). */
export async function expireVoiceMessage(chatId: string, messageId: string) {
  await updateDoc(doc(messagesCol(chatId), messageId), {
    mediaURL: null,
    voiceExpired: true,
  });
}

export async function pinMessage(chatId: string, messageId: string) {
  await updateDoc(chatDoc(chatId), { pinnedMessageId: messageId });
}

export async function unpinMessage(chatId: string) {
  await updateDoc(chatDoc(chatId), { pinnedMessageId: null });
}

export async function getMessageOnce(chatId: string, messageId: string): Promise<ChatMessage | null> {
  const snap = await getDoc(doc(messagesCol(chatId), messageId));
  return snap.exists() ? snap.data() : null;
}

export async function forwardMessagesTo(params: {
  originalChatId: string;
  messageIds: string[];
  targetChatId: string;
  targetParticipantIds: string[];
  forwarderUid: string;
  /** senderId -> display name, pre-fetched by the caller. */
  senderNames: Record<string, string>;
}): Promise<void> {
  for (const messageId of params.messageIds) {
    const original = await getMessageOnce(params.originalChatId, messageId);
    if (!original) continue;

    await sendMessage({
      chatId: params.targetChatId,
      senderId: params.forwarderUid,
      participantIds: params.targetParticipantIds,
      type: original.type,
      content: original.content ?? undefined,
      mediaURL: original.mediaURL ?? undefined,
      duration: original.duration ?? undefined,
      card: original.card ?? undefined,
      forwardedFrom: {
        chatId: params.originalChatId,
        senderName: params.senderNames[original.senderId] ?? "Kimdir",
      },
    });
  }
}
