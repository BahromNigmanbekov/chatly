"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImageBlob } from "@/lib/utils/cropImage";

interface AvatarCropModalProps {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void>;
}

/** Instagram/Telegram-style circular crop-before-upload step, shared by profile and group avatars. */
export function AvatarCropModal({ imageSrc, onCancel, onConfirm }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      await onConfirm(blob);
    } catch {
      setError("Rasmni saqlashda xatolik yuz berdi");
      setSaving(false);
    }
  }

  return (
    <div className="chatly-overlay-enter fixed inset-0 z-[60] flex flex-col bg-black">
      <div
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ paddingTop: "calc(var(--safe-top) + 0.75rem)" }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-sm font-medium disabled:opacity-40"
        >
          Bekor qilish
        </button>
        <span className="text-sm font-medium">Rasmni joylashtirish</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving || !croppedAreaPixels}
          className="text-sm font-semibold text-primary disabled:opacity-40"
        >
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </div>

      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_area, areaPixels) => setCroppedAreaPixels(areaPixels)}
        />
      </div>

      <div className="flex flex-col gap-2 px-6 py-5" style={{ paddingBottom: "calc(var(--safe-bottom) + 1.25rem)" }}>
        {error && <p className="text-center text-sm text-danger">{error}</p>}
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Kattalashtirish"
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
}
