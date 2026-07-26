"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UsernameField } from "@/components/auth/UsernameField";
import { changeUsername, logoutUser, updateProfileFields } from "@/lib/firebase/auth";
import { friendlyErrorMessage } from "@/lib/utils/firebaseError";
import { isValidUsername, normalizeUsername } from "@/lib/utils/username";
import type { UserProfile } from "@/types/user";

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const usernameChanged = normalizeUsername(username) !== profile.username;
  const canSave = displayName.trim().length > 0 && isValidUsername(username) && !saving;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      if (usernameChanged) {
        await changeUsername(profile.uid, username, profile.username);
      }
      await updateProfileFields(profile.uid, { displayName: displayName.trim(), bio: bio.trim() });
      setSaved(true);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  return (
    <form onSubmit={handleSave} className="flex w-full max-w-md flex-col gap-4">
      <Input
        label="Ism-familiya"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
      />
      <UsernameField value={username} onChange={setUsername} ignoreUid={profile.uid} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-sm font-medium text-text">
          Haqida
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={160}
          placeholder="O'zingiz haqingizda qisqacha..."
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus-visible:border-primary"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && !error && <p className="text-sm text-online">Saqlandi ✓</p>}
      <Button type="submit" size="lg" disabled={!canSave} className="w-full">
        {saving ? "Saqlanmoqda..." : "Saqlash"}
      </Button>
      <Button type="button" variant="secondary" onClick={handleLogout} className="w-full">
        Chiqish
      </Button>
    </form>
  );
}
