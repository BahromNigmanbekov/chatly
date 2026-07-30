"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { AvatarCropModal } from "@/components/profile/AvatarCropModal";
import { updateProfileFields } from "@/lib/firebase/auth";
import { avatarPath, deleteFromSupabase, uploadToSupabase } from "@/lib/supabase/storage";

interface AvatarUploaderProps {
  uid: string;
  name: string;
  photoURL: string | null;
}

export function AvatarUploader({ uid, name, photoURL }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Faqat rasm fayllari qabul qilinadi");
      return;
    }
    setError(null);
    setCropSrc(URL.createObjectURL(file));
  }

  async function handleCropConfirm(blob: Blob) {
    // Deliberately doesn't catch: on failure this throws back up to
    // AvatarCropModal, which keeps itself open and shows its own error —
    // closing the crop step on a failed upload would silently discard the
    // user's crop selection with no way to retry it.
    setSaving(true);
    try {
      const url = await uploadToSupabase(avatarPath(uid), blob, {
        upsert: true,
        contentType: "image/jpeg",
      });
      // Cache-bust: the path never changes (avatars/{uid}.jpg), so without a
      // unique query param the browser/CDN would keep showing the old photo.
      await updateProfileFields(uid, { photoURL: `${url}?v=${Date.now()}` });
      setCropSrc(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemovePhoto() {
    setConfirmingRemove(false);
    setSaving(true);
    setError(null);
    try {
      await deleteFromSupabase(avatarPath(uid)).catch(() => undefined);
      // The ONLY place photoURL is ever explicitly cleared — every other save
      // path (name/bio edits, error retries, background sweeps) must never
      // touch this field.
      await updateProfileFields(uid, { photoURL: null });
    } catch {
      setError("O'chirishda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar name={name} photoURL={photoURL} size="xl" />
        {saving && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Spinner className="border-white/40 border-t-white" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-primary hover:underline"
        >
          Rasmni o&apos;zgartirish
        </button>
        {photoURL && (
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            className="text-sm font-medium text-danger hover:underline"
          >
            Rasmni o&apos;chirish
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs text-danger">{error}</p>}

      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}

      <Modal
        open={confirmingRemove}
        onClose={() => setConfirmingRemove(false)}
        title="Rasmni o'chirish"
        maxWidthClassName="sm:max-w-sm"
      >
        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm text-text-muted">Profil rasmingizni o&apos;chirishni istaysizmi?</p>
          <Button variant="danger" className="w-full justify-center" onClick={handleRemovePhoto}>
            O&apos;chirish
          </Button>
          <Button variant="ghost" className="w-full justify-center" onClick={() => setConfirmingRemove(false)}>
            Bekor qilish
          </Button>
        </div>
      </Modal>
    </div>
  );
}
