import {
  collection,
  doc,
  type CollectionReference,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Chat } from "@/types/chat";
import type { ChatMessage } from "@/types/message";
import type { UserProfile } from "@/types/user";

function converter<T>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T): DocumentData {
      const rest = { ...(data as Record<string, unknown>) };
      delete rest.id;
      return rest;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return { id: snapshot.id, ...snapshot.data() } as T;
    },
  };
}

export const usersCol = collection(db, "users").withConverter(
  converter<UserProfile>(),
) as CollectionReference<UserProfile>;

export const chatsCol = collection(db, "chats").withConverter(
  converter<Chat>(),
) as CollectionReference<Chat>;

export function messagesCol(chatId: string) {
  return collection(db, "chats", chatId, "messages").withConverter(
    converter<ChatMessage>(),
  ) as CollectionReference<ChatMessage>;
}

export function userDoc(uid: string) {
  return doc(usersCol, uid);
}

export function chatDoc(chatId: string) {
  return doc(chatsCol, chatId);
}
