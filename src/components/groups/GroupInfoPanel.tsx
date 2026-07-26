"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MemberPicker } from "@/components/groups/MemberPicker";
import { MemberRow } from "@/components/groups/MemberRow";
import { useParticipantProfiles } from "@/hooks/useParticipantProfiles";
import {
  addGroupMembers,
  deleteGroup,
  leaveGroup,
  removeGroupMember,
  setGroupAdmin,
  updateGroupInfo,
} from "@/lib/firebase/groups";
import { groupPhotoPath, uploadWithProgress } from "@/lib/firebase/storage";
import type { Chat } from "@/types/chat";
import type { UserProfile } from "@/types/user";

export function GroupInfoPanel({ chat, uid }: { chat: Chat; uid: string }) {
  const router = useRouter();
  const profiles = useParticipantProfiles(chat.participantIds);
  const [name, setName] = useState(chat.groupName ?? "");
  const [addingMembers, setAddingMembers] = useState<UserProfile[]>([]);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = chat.ownerId === uid;
  const isAdmin = chat.adminIds.includes(uid);
  const members = chat.participantIds.map((id) => profiles[id]).filter(Boolean) as UserProfile[];

  async function handleRename() {
    if (!name.trim() || name.trim() === chat.groupName) return;
    await updateGroupInfo(chat.id, { groupName: name.trim() });
  }

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadWithProgress(groupPhotoPath(chat.id, file.name), file);
      await updateGroupInfo(chat.id, { groupPhotoURL: url });
    } finally {
      setBusy(false);
    }
  }

  async function handleAddMembers() {
    if (addingMembers.length === 0) return;
    await addGroupMembers(chat.id, addingMembers.map((m) => m.uid));
    setAddingMembers([]);
    setShowAddPicker(false);
  }

  async function handleToggleOnlyAdmins() {
    await updateGroupInfo(chat.id, { onlyAdminsCanPost: !chat.onlyAdminsCanPost });
  }

  async function handleLeave() {
    await leaveGroup(chat.id, uid);
    router.push("/");
  }

  async function handleDelete() {
    await deleteGroup(chat.id);
    router.push("/");
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
      <div className="flex flex-col items-center gap-2">
        <button type="button" onClick={() => (isAdmin ? fileInputRef.current?.click() : undefined)}>
          <Avatar name={chat.groupName ?? "Guruh"} photoURL={chat.groupPhotoURL} size="xl" />
        </button>
        {isAdmin && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhotoChange(e.target.files?.[0])}
          />
        )}
      </div>

      {isAdmin ? (
        <div className="flex items-end gap-2">
          <Input label="Guruh nomi" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <Button size="md" onClick={handleRename} disabled={busy}>
            Saqlash
          </Button>
        </div>
      ) : (
        <h2 className="text-center font-display text-lg font-semibold text-text">{chat.groupName}</h2>
      )}

      {isAdmin && (
        <label className="flex items-center justify-between rounded-xl border border-border px-3.5 py-3">
          <span className="text-sm text-text">Faqat adminlar xabar yoza oladi</span>
          <input
            type="checkbox"
            checked={chat.onlyAdminsCanPost}
            onChange={handleToggleOnlyAdmins}
            className="h-5 w-5 accent-primary"
          />
        </label>
      )}

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text">A&apos;zolar ({members.length})</span>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddPicker((v) => !v)}
              className="text-sm font-medium text-primary hover:underline"
            >
              + Qo&apos;shish
            </button>
          )}
        </div>

        {showAddPicker && (
          <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
            <MemberPicker
              excludeUid={uid}
              selected={addingMembers}
              onChange={(next) => setAddingMembers(next.filter((m) => !chat.participantIds.includes(m.uid)))}
            />
            <Button size="sm" onClick={handleAddMembers} disabled={addingMembers.length === 0}>
              Guruhga qo&apos;shish
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          {members.map((member) => (
            <MemberRow
              key={member.uid}
              member={member}
              isOwner={chat.ownerId === member.uid}
              isAdmin={chat.adminIds.includes(member.uid)}
              canManage={isAdmin}
              canManageAdmins={isOwner}
              onPromote={() => setGroupAdmin(chat.id, member.uid, true)}
              onDemote={() => setGroupAdmin(chat.id, member.uid, false)}
              onRemove={() => removeGroupMember(chat.id, member.uid)}
            />
          ))}
        </div>
      </div>

      {isOwner ? (
        <Button variant="danger" onClick={handleDelete}>
          Guruhni o&apos;chirish
        </Button>
      ) : (
        <Button variant="secondary" onClick={handleLeave}>
          Guruhdan chiqish
        </Button>
      )}
    </div>
  );
}
