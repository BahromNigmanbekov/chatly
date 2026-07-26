"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { updateProfileFields } from "@/lib/firebase/auth";
import { avatarPath, uploadWithProgress } from "@/lib/firebase/storage";

interface AvatarUploaderProps {
  uid: string;
  name: string;
  photoURL: string | null;
}

export function AvatarUploader({ uid, name, photoURL }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Faqat rasm fayllari qabul qilinadi");
      return;
    }
    setError(null);
    setProgress(0);
    try {
      const url = await uploadWithProgress(avatarPath(uid, file.name), file, setProgress);
      await updateProfileFields(uid, { photoURL: url });
    } catch {
      setError("Yuklashda xatolik yuz berdi");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar name={name} photoURL={photoURL} size="xl" />
        {progress !== null && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Spinner className="border-white/40 border-t-white" />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-sm font-medium text-primary hover:underline"
      >
        Rasmni o&apos;zgartirish
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
