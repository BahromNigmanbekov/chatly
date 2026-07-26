"use client";

import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { GroupCreateForm } from "@/components/groups/GroupCreateForm";
import { useModalStore } from "@/store/useModalStore";

export function GroupCreateModal() {
  const router = useRouter();
  const open = useModalStore((s) => s.groupCreateOpen);
  const setOpen = useModalStore((s) => s.setGroupCreateOpen);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Yangi guruh">
      <GroupCreateForm
        onCreated={(chatId) => {
          setOpen(false);
          router.push(`/chats/${chatId}`);
        }}
      />
    </Modal>
  );
}
