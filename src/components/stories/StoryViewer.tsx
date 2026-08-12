"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiEye, FiX } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { StoryViewersModal } from "@/components/stories/StoryViewersModal";
import { deleteStory, markStoryViewed, toggleStoryReaction } from "@/lib/firebase/stories";
import { deleteFromSupabase, pathFromPublicUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils/cn";
import type { Story } from "@/types/story";
import type { UserProfile } from "@/types/user";

const STORY_DURATION_MS = 5000;
const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

interface StoryViewerProps {
  initialUid: string;
  /** uids in tray order — advances to the next person once the current one's stories run out. */
  order: string[];
  storiesByUid: Map<string, Story[]>;
  profiles: Record<string, UserProfile>;
  myUid: string;
  onClose: () => void;
}

/** Desktop-only: dimmed peek at the neighboring person's story, off to the side of the main card. */
function SidePreview({
  uid,
  storiesByUid,
  profiles,
  onClick,
  side,
}: {
  uid: string;
  storiesByUid: Map<string, Story[]>;
  profiles: Record<string, UserProfile>;
  onClick: () => void;
  side: "left" | "right";
}) {
  const story = storiesByUid.get(uid)?.[0];
  const profile = profiles[uid];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Oldingi hikoya" : "Keyingi hikoya"}
      className="relative h-[70vh] max-h-175 w-32 shrink-0 overflow-hidden rounded-2xl opacity-45 transition-opacity hover:opacity-70"
    >
      {story && (
        story.mediaType === "video" ? (
          <video src={story.mediaURL} className="h-full w-full object-cover" muted />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.mediaURL} alt="" className="h-full w-full object-cover" />
        )
      )}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-3 py-3">
        <span className="line-clamp-1 text-xs font-medium text-white">{profile?.displayName ?? "..."}</span>
      </div>
    </button>
  );
}

/** Full-screen story viewer — progress bars, tap-to-navigate, reactions, and (for your own story) a viewer list. */
export function StoryViewer({ initialUid, order, storiesByUid, profiles, myUid, onClose }: StoryViewerProps) {
  const [personIndex, setPersonIndex] = useState(() => Math.max(0, order.indexOf(initialUid)));
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [paused, setPaused] = useState(false);

  const currentUid = order[personIndex];
  const stories = storiesByUid.get(currentUid) ?? [];
  const story = stories[storyIndex];
  const isMine = currentUid === myUid;
  const authorProfile = profiles[currentUid];

  useEffect(() => {
    if (story && !isMine && !story.viewedBy.includes(myUid)) {
      void markStoryViewed(story.id, myUid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  useEffect(() => {
    setStoryIndex(0);
    setProgress(0);
  }, [currentUid]);

  // `order` can include hollow entries (e.g. the viewer's own uid when they
  // have no story) — skip past those instead of landing on an empty story,
  // which would otherwise make the whole viewer disappear (`if (!story)
  // return null` below).
  function goNextPerson() {
    for (let i = personIndex + 1; i < order.length; i++) {
      if ((storiesByUid.get(order[i])?.length ?? 0) > 0) {
        setPersonIndex(i);
        return;
      }
    }
    onClose();
  }

  function goPrevPerson() {
    for (let i = personIndex - 1; i >= 0; i--) {
      if ((storiesByUid.get(order[i])?.length ?? 0) > 0) {
        setPersonIndex(i);
        return;
      }
    }
    onClose();
  }

  function goNextStory() {
    if (storyIndex < stories.length - 1) {
      setStoryIndex((i) => i + 1);
      setProgress(0);
    } else {
      goNextPerson();
    }
  }

  function goPrevStory() {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      setProgress(0);
    } else {
      goPrevPerson();
    }
  }

  useEffect(() => {
    if (paused || !story || story.mediaType === "video") return;
    const start = Date.now() - progress * STORY_DURATION_MS;
    const interval = setInterval(() => {
      const pct = Math.min(1, (Date.now() - start) / STORY_DURATION_MS);
      setProgress(pct);
      if (pct >= 1) goNextStory();
    }, 50);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, paused]);

  function handleReact(emoji: string) {
    if (!story) return;
    const already = (story.reactions[emoji] ?? []).includes(myUid);
    void toggleStoryReaction(story.id, myUid, emoji, !already);
  }

  async function handleDelete() {
    if (!story) return;
    const path = pathFromPublicUrl(story.mediaURL);
    if (path) await deleteFromSupabase(path).catch(() => undefined);
    await deleteStory(story.id);
    goNextStory();
  }

  if (!story) return null;

  // `order` includes the viewer's own uid even when they have no story of
  // their own (so tapping into "my" spot from the tray still works) — that
  // makes it a hollow neighbor with nothing to preview, so side-preview
  // candidates are filtered down to people who actually have a story.
  const prevUid = personIndex > 0 ? order[personIndex - 1] : null;
  const nextUid = personIndex < order.length - 1 ? order[personIndex + 1] : null;
  const prevPreviewUid = prevUid && (storiesByUid.get(prevUid)?.length ?? 0) > 0 ? prevUid : null;
  const nextPreviewUid = nextUid && (storiesByUid.get(nextUid)?.length ?? 0) > 0 ? nextUid : null;

  // Portalled to <body>: the sidebar's pull-to-reveal panel animates via a
  // CSS `transform`, which makes it a containing block for any `position:
  // fixed` descendant — without escaping that ancestor, this viewer would
  // render clipped to the panel's own small box instead of the viewport.
  return createPortal(
    <div
      className="chatly-overlay-enter fixed inset-0 z-70 flex items-center justify-center md:bg-black/85"
      onClick={onClose}
    >
      {prevPreviewUid && (
        <div className="absolute left-4 top-1/2 hidden -translate-y-1/2 md:block lg:left-16">
          <SidePreview uid={prevPreviewUid} storiesByUid={storiesByUid} profiles={profiles} onClick={() => setPersonIndex((i) => i - 1)} side="left" />
        </div>
      )}

      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-black md:h-[85vh] md:max-h-190 md:w-105 md:rounded-2xl md:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-1 px-2 pt-[calc(var(--safe-top)+0.5rem)] md:pt-3">
          {stories.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white"
                style={{ width: `${i < storyIndex ? 100 : i === storyIndex ? progress * 100 : 0}%` }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-2">
          <Avatar name={authorProfile?.displayName ?? "..."} photoURL={authorProfile?.photoURL} size="sm" />
          <span className="flex-1 text-sm font-medium text-white">{isMine ? "Siz" : authorProfile?.displayName}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          {story.mediaType === "video" ? (
            <video src={story.mediaURL} className="max-h-full max-w-full" autoPlay muted playsInline onEnded={goNextStory} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={story.mediaURL} alt="" className="max-h-full max-w-full object-contain" />
          )}
          <button
            type="button"
            aria-label="Oldingi"
            className="absolute left-0 top-0 h-full w-1/3"
            onClick={goPrevStory}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
          />
          <button
            type="button"
            aria-label="Keyingi"
            className="absolute right-0 top-0 h-full w-1/3"
            onClick={goNextStory}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-4" style={{ paddingBottom: "calc(var(--safe-bottom) + 1rem)" }}>
          {isMine ? (
            <>
              <button
                type="button"
                onClick={() => setViewersOpen(true)}
                className="flex items-center gap-1.5 text-sm text-white/80"
              >
                <FiEye className="h-4 w-4" /> {story.viewedBy.length}
              </button>
              <button type="button" onClick={handleDelete} className="ml-auto text-sm text-danger">
                O&apos;chirish
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReact(emoji)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors",
                    (story.reactions[emoji] ?? []).includes(myUid) ? "bg-white/30" : "bg-white/10 hover:bg-white/20",
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {viewersOpen && <StoryViewersModal story={story} profiles={profiles} onClose={() => setViewersOpen(false)} />}
      </div>

      {nextPreviewUid && (
        <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 md:block lg:right-16">
          <SidePreview uid={nextPreviewUid} storiesByUid={storiesByUid} profiles={profiles} onClick={() => setPersonIndex((i) => i + 1)} side="right" />
        </div>
      )}
    </div>,
    document.body,
  );
}
