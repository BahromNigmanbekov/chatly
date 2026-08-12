"use client";

import { useMemo, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { useChats } from "@/hooks/useChats";
import { otherParticipantId } from "@/hooks/useChatDisplay";
import { useParticipantProfiles } from "@/hooks/useParticipantProfiles";
import { useStories } from "@/hooks/useStories";
import { useStoryExpirySweep } from "@/hooks/useStoryExpirySweep";
import { createStory, reserveStoryId } from "@/lib/firebase/stories";
import {
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  UploadSizeError,
  assertMaxSize,
  storyPath,
  uploadToSupabase,
} from "@/lib/supabase/storage";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";

/** Horizontal row of story avatars — "Add" first, then contacts with an active story, gradient ring for unseen. */
export function StoryTray() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const profile = useAuthStore((s) => s.profile);
  const { chats } = useChats(uid);
  const showToast = useToastStore((s) => s.show);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [viewingUid, setViewingUid] = useState<string | null>(null);

  const contactIds = useMemo(() => {
    const ids = chats
      .filter((c) => c.type === "direct")
      .map((c) => otherParticipantId(c, uid ?? ""))
      .filter((id): id is string => Boolean(id));
    return Array.from(new Set(ids));
  }, [chats, uid]);

  const { storiesByUid } = useStories(uid, contactIds);
  const profiles = useParticipantProfiles(uid ? [uid, ...contactIds] : []);
  useStoryExpirySweep(uid);

  const myStories = uid ? (storiesByUid.get(uid) ?? []) : [];
  const othersWithStories = contactIds.filter((id) => (storiesByUid.get(id) ?? []).length > 0);
  const viewOrder = uid ? [uid, ...othersWithStories] : othersWithStories;

  async function handlePick(file: File | undefined) {
    if (!file || !uid) return;
    const isVideo = file.type.startsWith("video/");
    try {
      assertMaxSize(file, isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES, isVideo ? 50 : 10);
      setUploading(true);
      const storyId = reserveStoryId();
      const url = await uploadToSupabase(storyPath(uid, storyId, file.name), file);
      await createStory(uid, url, isVideo ? "video" : "image", storyId);
      showToast("Status qo'shildi");
    } catch (err) {
      showToast(err instanceof UploadSizeError ? err.message : "Status yuklab bo'lmadi");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!uid) return null;

  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-1 pt-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handlePick(e.target.files?.[0])}
      />

      {myStories.length > 0 ? (
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className="relative">
            <button type="button" onClick={() => setViewingUid(uid)} disabled={uploading} aria-label="Statusni ko'rish">
              <Avatar name={profile?.displayName ?? "Men"} photoURL={profile?.photoURL} size="story" className="ring-2 ring-white/40" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Status qo'shish"
              className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#cfcce4] text-[#1c1b2e] ring-2 ring-black"
            >
              {uploading ? <Spinner className="h-3 w-3 border-[#1c1b2e]/40 border-t-[#1c1b2e]" /> : <FiPlus className="h-3 w-3" />}
            </button>
          </div>
          <span className="max-w-16 truncate text-[11px] text-white/70">Siz</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Status qo'shish"
          className="flex shrink-0 flex-col items-center gap-1"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/50 text-white">
            {uploading ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <FiPlus className="h-5 w-5" />}
          </span>
          <span className="text-[11px] text-white/70">Add</span>
        </button>
      )}

      {othersWithStories.map((contactId) => {
        const contactProfile = profiles[contactId];
        if (!contactProfile) return null;
        return (
          <button
            key={contactId}
            type="button"
            onClick={() => setViewingUid(contactId)}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <Avatar name={contactProfile.displayName} photoURL={contactProfile.photoURL} size="story" className="ring-2 ring-white/40" />
            <span className="max-w-16 truncate text-[11px] text-white/70">{contactProfile.displayName.split(" ")[0]}</span>
          </button>
        );
      })}

      {viewingUid && (
        <StoryViewer
          initialUid={viewingUid}
          order={viewOrder}
          storiesByUid={storiesByUid}
          profiles={profiles}
          myUid={uid}
          onClose={() => setViewingUid(null)}
        />
      )}
    </div>
  );
}
