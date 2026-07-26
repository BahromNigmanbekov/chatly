"use client";

import { Avatar } from "@/components/ui/Avatar";
import { OnlineDot } from "@/components/presence/OnlineDot";
import { usePresence } from "@/hooks/usePresence";
import type { UserProfile } from "@/types/user";

interface MemberRowProps {
  member: UserProfile;
  isOwner: boolean;
  isAdmin: boolean;
  canManage: boolean;
  canManageAdmins: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onRemove: () => void;
}

export function MemberRow({
  member,
  isOwner,
  isAdmin,
  canManage,
  canManageAdmins,
  onPromote,
  onDemote,
  onRemove,
}: MemberRowProps) {
  const presence = usePresence(member.uid);

  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2">
      <div className="relative shrink-0">
        <Avatar name={member.displayName} photoURL={member.photoURL} size="sm" />
        <OnlineDot online={presence.online} className="absolute -bottom-0.5 -right-0.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-text">{member.displayName}</div>
        <div className="truncate text-xs text-text-muted">@{member.username}</div>
      </div>
      {isOwner && <span className="text-xs font-medium text-accent">Egasi</span>}
      {!isOwner && isAdmin && <span className="text-xs font-medium text-primary">Admin</span>}

      {!isOwner && (canManage || canManageAdmins) && (
        <div className="flex items-center gap-1">
          {canManageAdmins && !isAdmin && (
            <button type="button" onClick={onPromote} className="text-xs text-primary hover:underline">
              Admin qilish
            </button>
          )}
          {canManageAdmins && isAdmin && (
            <button type="button" onClick={onDemote} className="text-xs text-text-muted hover:underline">
              Admindan olish
            </button>
          )}
          {canManage && !isAdmin && (
            <button type="button" onClick={onRemove} className="text-xs text-danger hover:underline">
              Chiqarish
            </button>
          )}
        </div>
      )}
    </div>
  );
}
