import { arrayRemove, arrayUnion, deleteDoc, doc, serverTimestamp, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { storiesCol, storyDoc } from "@/lib/firebase/firestore";
import { STORY_TTL_MS } from "@/types/story";

/** Reserves a story ID before upload, so the Supabase media path can embed it. */
export function reserveStoryId(): string {
  return doc(storiesCol).id;
}

export async function createStory(
  uid: string,
  mediaURL: string,
  mediaType: "image" | "video",
  storyId: string = reserveStoryId(),
): Promise<string> {
  const ref = doc(storiesCol, storyId);
  await setDoc(ref, {
    id: "",
    uid,
    mediaURL,
    mediaType,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + STORY_TTL_MS),
    viewedBy: [],
    reactions: {},
  });
  return ref.id;
}

export async function markStoryViewed(storyId: string, uid: string) {
  await updateDoc(storyDoc(storyId), { viewedBy: arrayUnion(uid) });
}

export async function toggleStoryReaction(storyId: string, uid: string, emoji: string, reacted: boolean) {
  await updateDoc(storyDoc(storyId), {
    [`reactions.${emoji}`]: reacted ? arrayUnion(uid) : arrayRemove(uid),
  });
}

export async function deleteStory(storyId: string) {
  await deleteDoc(storyDoc(storyId));
}
