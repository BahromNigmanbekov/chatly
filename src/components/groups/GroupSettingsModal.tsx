"use client";

import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { GroupInfoPanel } from "@/components/groups/GroupInfoPanel";
import { useChatDoc } from "@/hooks/useChatDoc";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";

export function GroupSettingsModal() {
  const chatId = useModalStore((s) => s.groupSettingsChatId);
  const setChatId = useModalStore((s) => s.setGroupSettingsChatId);
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const { chat, loading } = useChatDoc(chatId);

  return (
    <Modal open={Boolean(chatId)} onClose={() => setChatId(null)} title="Guruh haqida" maxWidthClassName="sm:max-w-lg">
      {loading || !chat || !uid ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <GroupInfoPanel chat={chat} uid={uid} onDeleted={() => setChatId(null)} onLeft={() => setChatId(null)} />
      )}
    </Modal>
  );
}
