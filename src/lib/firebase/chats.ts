import { addDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { chatsCol } from "@/lib/firebase/firestore";

/** Finds an existing 1:1 chat between the two users, or creates one. Returns the chat id. */
export async function getOrCreateDirectChat(uidA: string, uidB: string): Promise<string> {
  const q = query(
    chatsCol,
    where("type", "==", "direct"),
    where("participantIds", "array-contains", uidA),
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find((d) => d.data().participantIds.includes(uidB));
  if (existing) return existing.id;

  const ref = await addDoc(chatsCol, {
    id: "",
    type: "direct",
    participantIds: [uidA, uidB],
    groupName: null,
    groupPhotoURL: null,
    adminIds: [],
    ownerId: null,
    onlyAdminsCanPost: false,
    lastMessage: null,
    typingStatus: {},
    unreadCounts: { [uidA]: 0, [uidB]: 0 },
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function createGroupChat(params: {
  ownerId: string;
  memberIds: string[];
  groupName: string;
  groupPhotoURL?: string | null;
}): Promise<string> {
  const participantIds = Array.from(new Set([params.ownerId, ...params.memberIds]));
  const unreadCounts = Object.fromEntries(participantIds.map((id) => [id, 0]));

  const ref = await addDoc(chatsCol, {
    id: "",
    type: "group",
    participantIds,
    groupName: params.groupName,
    groupPhotoURL: params.groupPhotoURL ?? null,
    adminIds: [params.ownerId],
    ownerId: params.ownerId,
    onlyAdminsCanPost: false,
    lastMessage: null,
    typingStatus: {},
    unreadCounts,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
