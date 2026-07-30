"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MemberPicker } from "@/components/groups/MemberPicker";
import { createGroupChat } from "@/lib/firebase/chats";
import { groupPhotoPath, uploadToSupabase } from "@/lib/supabase/storage";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserProfile } from "@/types/user";

export function GroupCreateForm({ onCreated }: { onCreated: (chatId: string) => void }) {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const profile = useAuthStore((s) => s.profile);
  const [name, setName] = useState("");
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canCreate = name.trim().length > 0 && members.length > 0 && !creating;

  function handlePhotoPick(file: File | undefined) {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleCreate() {
    if (!uid || !canCreate) return;
    setCreating(true);
    setError(null);
    try {
      let groupPhotoURL: string | undefined;
      if (photoFile) {
        // Group id isn't known yet, so store under a temp key then let the chat doc reference it.
        groupPhotoURL = await uploadToSupabase(groupPhotoPath(`pending-${uid}-${Date.now()}`), photoFile);
      }
      const chatId = await createGroupChat({
        ownerId: uid,
        ownerName: profile?.displayName ?? "Kimdir",
        memberIds: members.map((m) => m.uid),
        groupName: name.trim(),
        groupPhotoURL,
      });
      onCreated(chatId);
    } catch {
      setError("Guruh yaratishda xatolik yuz berdi");
      setCreating(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-4 px-4 py-6">
      <div className="flex flex-col items-center gap-2">
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          {photoPreview ? (
            <Avatar name={name || "G"} photoURL={photoPreview} size="xl" />
          ) : (
            <Avatar name={name || "Guruh"} photoURL={null} size="xl" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePhotoPick(e.target.files?.[0])}
        />
        <span className="text-xs text-text-muted">Guruh rasmi (ixtiyoriy)</span>
      </div>

      <Input label="Guruh nomi" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jamoa chati" />

      <MemberPicker excludeUid={uid ?? ""} selected={members} onChange={setMembers} />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button size="lg" disabled={!canCreate} onClick={handleCreate} className="w-full">
        {creating ? "Yaratilmoqda..." : "Guruh yaratish"}
      </Button>
    </div>
  );
}
