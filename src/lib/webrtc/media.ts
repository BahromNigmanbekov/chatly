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
    console.log("[WebRTC] requesting getUserMedia", { type, facingMode });
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video" ? { facingMode } : false,
    });
    console.log(
      "[WebRTC] getUserMedia resolved",
      "audio tracks:", stream.getAudioTracks().map((t) => ({ label: t.label, enabled: t.enabled, readyState: t.readyState })),
      "video tracks:", stream.getVideoTracks().map((t) => ({ label: t.label, enabled: t.enabled, readyState: t.readyState })),
    );
    return stream;
  } catch (err) {
    console.error("[WebRTC] getUserMedia rejected", err);
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
