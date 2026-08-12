"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Emoji } from "@/components/ui/Emoji";
import { Modal } from "@/components/ui/Modal";
import type { Story } from "@/types/story";
import type { UserProfile } from "@/types/user";

interface StoryViewersModalProps {
  story: Story;
  profiles: Record<string, UserProfile>;
  onClose: () => void;
}

/** Who viewed your story, and what they reacted with (if anything) — shown only to the story's own author. */
export function StoryViewersModal({ story, profiles, onClose }: StoryViewersModalProps) {
  const reactionByUid = new Map<string, string>();
  for (const [emoji, uids] of Object.entries(story.reactions)) {
    for (const reactorUid of uids) reactionByUid.set(reactorUid, emoji);
  }

  return (
    <Modal open onClose={onClose} title={`Ko'rganlar (${story.viewedBy.length})`} maxWidthClassName="sm:max-w-xs">
      <div className="flex flex-col gap-1 px-2 py-3">
        {story.viewedBy.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-text-muted">Hali hech kim ko&apos;rmagan</p>
        ) : (
          story.viewedBy.map((viewerUid) => {
            const profile = profiles[viewerUid];
            return (
              <div key={viewerUid} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <Avatar name={profile?.displayName ?? "..."} photoURL={profile?.photoURL} size="sm" ring />
                <span className="flex-1 truncate text-sm text-text">{profile?.displayName ?? "Foydalanuvchi"}</span>
                {reactionByUid.has(viewerUid) && (
                  <span className="h-5 w-5"><Emoji emoji={reactionByUid.get(viewerUid)!} /></span>
                )}
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}
