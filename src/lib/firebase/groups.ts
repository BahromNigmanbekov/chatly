import { arrayRemove, arrayUnion, deleteDoc, updateDoc } from "firebase/firestore";
import { chatDoc } from "@/lib/firebase/firestore";

export async function updateGroupInfo(
  chatId: string,
  fields: { groupName?: string; groupPhotoURL?: string; onlyAdminsCanPost?: boolean },
) {
  await updateDoc(chatDoc(chatId), fields);
}

export async function addGroupMembers(chatId: string, memberIds: string[]) {
  await updateDoc(chatDoc(chatId), {
    participantIds: arrayUnion(...memberIds),
    ...Object.fromEntries(memberIds.map((id) => [`unreadCounts.${id}`, 0])),
  });
}

export async function removeGroupMember(chatId: string, memberId: string) {
  await updateDoc(chatDoc(chatId), {
    participantIds: arrayRemove(memberId),
    adminIds: arrayRemove(memberId),
  });
}

export async function setGroupAdmin(chatId: string, memberId: string, isAdmin: boolean) {
  await updateDoc(chatDoc(chatId), {
    adminIds: isAdmin ? arrayUnion(memberId) : arrayRemove(memberId),
  });
}

export async function leaveGroup(chatId: string, uid: string) {
  await removeGroupMember(chatId, uid);
}

export async function deleteGroup(chatId: string) {
  await deleteDoc(chatDoc(chatId));
}
