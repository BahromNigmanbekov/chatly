"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import type { UserProfile } from "@/types/user";

interface ReactionsListModalProps {
  open: boolean;
  onClose: () => void;
  reactions: Record<string, string[]>;
  participantProfiles: Record<string, UserProfile>;
}

/** Shows who reacted with which emoji — opened by tapping a reaction pill. */
export function ReactionsListModal({ open, onClose, reactions, participantProfiles }: ReactionsListModalProps) {
  const entries = Object.entries(reactions).filter(([, uids]) => uids.length > 0);

  return (
    <Modal open={open} onClose={onClose} title="Reaksiyalar" maxWidthClassName="sm:max-w-xs">
      <div className="flex flex-col gap-4 px-4 py-4">
        {entries.map(([emoji, uids]) => (
          <div key={emoji}>
            <div className="mb-1.5 flex items-center gap-2 text-sm font-medium text-text">
              <span className="text-lg">{emoji}</span>
              <span className="tabular-nums">{uids.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              {uids.map((reactorUid) => {
                const profile = participantProfiles[reactorUid];
                return (
                  <div key={reactorUid} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                    <Avatar name={profile?.displayName ?? "..."} photoURL={profile?.photoURL} size="sm" ring />
                    <span className="text-sm text-text">{profile?.displayName ?? "Foydalanuvchi"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
