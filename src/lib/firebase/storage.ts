import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from "firebase/storage";
import { storage } from "@/lib/firebase/client";

export function uploadWithProgress(
  path: string,
  file: Blob,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(percent);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      },
    );
  });
}

export function avatarPath(uid: string, filename: string) {
  return `avatars/${uid}/${Date.now()}-${filename}`;
}

export function chatMediaPath(chatId: string, uid: string, filename: string) {
  return `chats/${chatId}/${uid}-${Date.now()}-${filename}`;
}

export function groupPhotoPath(chatId: string, filename: string) {
  return `groups/${chatId}/${Date.now()}-${filename}`;
}
