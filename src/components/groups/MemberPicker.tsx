"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useUserSearch } from "@/hooks/useUserSearch";
import type { UserProfile } from "@/types/user";

interface MemberPickerProps {
  excludeUid: string;
  selected: UserProfile[];
  onChange: (members: UserProfile[]) => void;
}

export function MemberPicker({ excludeUid, selected, onChange }: MemberPickerProps) {
  const [term, setTerm] = useState("");
  const { results, loading } = useUserSearch(term, excludeUid);
  const selectedIds = new Set(selected.map((u) => u.uid));

  function toggle(user: UserProfile) {
    if (selectedIds.has(user.uid)) {
      onChange(selected.filter((u) => u.uid !== user.uid));
    } else {
      onChange([...selected, user]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-text">A&apos;zolarni qo&apos;shish</span>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((user) => (
            <button
              key={user.uid}
              type="button"
              onClick={() => toggle(user)}
              className="flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary"
            >
              {user.displayName}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}

      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="@username qidiring"
      />

      {loading && (
        <div className="flex justify-center py-2">
          <Spinner className="h-4 w-4" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto rounded-xl border border-border p-1">
          {results.map((user) => (
            <button
              key={user.uid}
              type="button"
              onClick={() => toggle(user)}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-primary-soft"
            >
              <Avatar name={user.displayName} photoURL={user.photoURL} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text">{user.displayName}</div>
                <div className="truncate text-xs text-text-muted">@{user.username}</div>
              </div>
              <span
                className={
                  selectedIds.has(user.uid)
                    ? "text-primary"
                    : "text-transparent"
                }
                aria-hidden
              >
                ✓
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
