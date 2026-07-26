import { create } from "zustand";

interface DeleteMessageTarget {
  chatId: string;
  messageId: string;
  mine: boolean;
}

interface ForwardMessageTarget {
  chatId: string;
  messageIds: string[];
}

interface ModalState {
  groupCreateOpen: boolean;
  setGroupCreateOpen: (open: boolean) => void;

  groupSettingsChatId: string | null;
  setGroupSettingsChatId: (chatId: string | null) => void;

  editProfileOpen: boolean;
  setEditProfileOpen: (open: boolean) => void;

  deleteMessageTarget: DeleteMessageTarget | null;
  setDeleteMessageTarget: (target: DeleteMessageTarget | null) => void;

  forwardMessageTarget: ForwardMessageTarget | null;
  setForwardMessageTarget: (target: ForwardMessageTarget | null) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  groupCreateOpen: false,
  setGroupCreateOpen: (groupCreateOpen) => set({ groupCreateOpen }),

  groupSettingsChatId: null,
  setGroupSettingsChatId: (groupSettingsChatId) => set({ groupSettingsChatId }),

  editProfileOpen: false,
  setEditProfileOpen: (editProfileOpen) => set({ editProfileOpen }),

  deleteMessageTarget: null,
  setDeleteMessageTarget: (deleteMessageTarget) => set({ deleteMessageTarget }),

  forwardMessageTarget: null,
  setForwardMessageTarget: (forwardMessageTarget) => set({ forwardMessageTarget }),
}));
