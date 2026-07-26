"use client";

import { DeleteMessageModal } from "@/components/chat/DeleteMessageModal";
import { ForwardMessageModal } from "@/components/chat/ForwardMessageModal";
import { GroupCreateModal } from "@/components/groups/GroupCreateModal";
import { GroupSettingsModal } from "@/components/groups/GroupSettingsModal";
import { EditProfileModal } from "@/components/profile/EditProfileModal";

/** Renders every app-wide modal once, regardless of route. Each one reads its own open/closed state from useModalStore. */
export function ModalHost() {
  return (
    <>
      <GroupCreateModal />
      <GroupSettingsModal />
      <EditProfileModal />
      <DeleteMessageModal />
      <ForwardMessageModal />
    </>
  );
}
