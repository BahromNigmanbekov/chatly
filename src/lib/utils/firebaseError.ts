import { UsernameTakenError } from "@/lib/firebase/auth";

const CODE_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Bu email allaqachon ro'yxatdan o'tgan",
  "auth/invalid-email": "Email manzili noto'g'ri",
  "auth/weak-password": "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
  "auth/user-not-found": "Bunday foydalanuvchi topilmadi",
  "auth/wrong-password": "Email yoki parol noto'g'ri",
  "auth/invalid-credential": "Email yoki parol noto'g'ri",
  "auth/too-many-requests": "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring",
};

export function friendlyErrorMessage(err: unknown): string {
  if (err instanceof UsernameTakenError) return err.message;
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: string }).code;
    if (CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  }
  if (err instanceof Error) return err.message;
  return "Xatolik yuz berdi. Qayta urinib ko'ring";
}
