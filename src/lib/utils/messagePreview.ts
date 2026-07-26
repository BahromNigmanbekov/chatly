import type { ChatMessage } from "@/types/message";

export function messagePreviewText(message: ChatMessage): string {
  switch (message.type) {
    case "voice":
      return "🎤 Ovozli xabar";
    case "image":
      return "📷 Rasm";
    case "video":
      return "🎬 Video";
    case "card":
      return message.card?.title ?? "📋 Karta";
    case "system":
      return message.content ?? "";
    default:
      return message.content ?? "";
  }
}
