import type { Timestamp } from "firebase/firestore";

function toDate(value: Timestamp | Date | number | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  return value.toDate();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function timeOfDay(date: Date): string {
  return date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

/** Short timestamp for chat list / message bubbles: "14:32", "kecha", "12-iyul". */
export function formatMessageTime(value: Timestamp | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  const now = new Date();
  if (isSameDay(date, now)) return timeOfDay(date);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "kecha";

  return date.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
}

/** "oxirgi marta bugun 14:32 da" / "oxirgi marta kecha 09:10 da" / "oxirgi marta 12-iyul, 09:10 da". */
export function formatLastSeen(value: Timestamp | Date | number | null | undefined): string {
  const date = toDate(value);
  if (!date) return "oxirgi marta ko'rilgan vaqt noma'lum";
  const now = new Date();

  if (isSameDay(date, now)) {
    return `oxirgi marta bugun ${timeOfDay(date)} da`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `oxirgi marta kecha ${timeOfDay(date)} da`;
  }

  const dateLabel = date.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
  return `oxirgi marta ${dateLabel}, ${timeOfDay(date)} da`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
