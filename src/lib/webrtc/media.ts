import type { CallType } from "@/types/call";

export type MediaErrorKind = "permission-denied" | "device-not-found" | "unknown";

export class MediaAccessError extends Error {
  kind: MediaErrorKind;
  constructor(kind: MediaErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = "MediaAccessError";
  }
}

export async function getLocalMedia(type: CallType, facingMode: "user" | "environment" = "user") {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video" ? { facingMode } : false,
    });
  } catch (err) {
    if (err instanceof DOMException) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        throw new MediaAccessError(
          "permission-denied",
          "Kamera/mikrofonga ruxsat berilmagan. Brauzer sozlamalaridan sayt uchun ruxsatni yoqing.",
        );
      }
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        throw new MediaAccessError("device-not-found", "Qurilmada kamera yoki mikrofon topilmadi.");
      }
    }
    throw new MediaAccessError("unknown", "Kamera/mikrofonni ishga tushirib bo'lmadi.");
  }
}
