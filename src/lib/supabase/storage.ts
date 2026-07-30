import { SUPABASE_ANON_KEY, SUPABASE_BUCKET, SUPABASE_URL } from "@/lib/supabase/client";

/**
 * SECURITY NOTE (temporary, documented per explicit product decision):
 * Firebase Auth sessions aren't understood by Supabase's RLS system, so this
 * bucket currently runs fully public/open — uploads authenticate with only
 * the public anon key, and anyone holding it could write or overwrite any
 * object path. Acceptable for this project's current size/risk level, but not
 * a long-term answer. Future hardening: a Supabase Edge Function that
 * verifies the caller's Firebase ID token (via Firebase's public JWKS) before
 * minting a short-lived signed upload URL, so writes require a valid Chatly
 * session instead of just the anon key.
 */

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export class UploadSizeError extends Error {
  constructor(limitMB: number) {
    super(`Fayl hajmi ${limitMB}MB dan oshmasligi kerak`);
    this.name = "UploadSizeError";
  }
}

function objectUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${path}`;
}

function publicUrlFor(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
}

/** Extracts the object path back out of a public URL this module produced, or null if it doesn't match. */
export function pathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

/**
 * Uploads via the raw Storage REST endpoint (rather than the supabase-js
 * client) so we can report byte-level progress through XHR's upload.onprogress
 * — the JS client's fetch-based upload has no progress hook.
 */
export function uploadToSupabase(
  path: string,
  file: Blob,
  opts: { onProgress?: (percent: number) => void; upsert?: boolean; contentType?: string } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", objectUrl(path), true);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Authorization", `Bearer ${SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader("Content-Type", opts.contentType || file.type || "application/octet-stream");
    if (opts.upsert) xhr.setRequestHeader("x-upsert", "true");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.((e.loaded / e.total) * 100);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(publicUrlFor(path));
      } else {
        reject(new Error(`Supabase yuklash xatosi (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Tarmoq xatosi: fayl yuklanmadi"));
    xhr.send(file);
  });
}

export async function deleteFromSupabase(path: string): Promise<void> {
  await fetch(objectUrl(path), {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
}

/** Throws UploadSizeError if `file` exceeds the given limit. */
export function assertMaxSize(file: Blob, maxBytes: number, limitMB: number) {
  if (file.size > maxBytes) throw new UploadSizeError(limitMB);
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function chatMediaPath(chatId: string, messageId: string, filename: string) {
  return `${chatId}/${messageId}-${sanitizeFilename(filename)}`;
}

export function avatarPath(uid: string) {
  return `avatars/${uid}.jpg`;
}

export function groupPhotoPath(chatId: string) {
  return `groups/${chatId}.jpg`;
}
