"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuthStore } from "@/store/useAuthStore";
import { deleteMessage } from "@/lib/firebase/messages";
import { useModalStore } from "@/store/useModalStore";

export function DeleteMessageModal() {
  const target = useModalStore((s) => s.deleteMessageTarget);
  const setTarget = useModalStore((s) => s.setDeleteMessageTarget);
  const uid = useAuthStore((s) => s.firebaseUser?.uid);

  async function handleDelete(mode: "me" | "everyone") {
    if (!target || !uid) return;
    await deleteMessage(target.chatId, target.messageId, uid, mode);
    setTarget(null);
  }

  return (
    <Modal open={Boolean(target)} onClose={() => setTarget(null)} title="Xabarni o'chirish" maxWidthClassName="sm:max-w-sm">
      <div className="flex flex-col gap-2 p-4">
        <Button variant="secondary" className="w-full justify-center" onClick={() => handleDelete("me")}>
          Faqat men uchun o&apos;chirish
        </Button>
        {target?.mine && (
          <Button variant="danger" className="w-full justify-center" onClick={() => handleDelete("everyone")}>
            Hammaga o&apos;chirish
          </Button>
        )}
        <Button variant="ghost" className="w-full justify-center" onClick={() => setTarget(null)}>
          Bekor qilish
        </Button>
      </div>
    </Modal>
  );
}
