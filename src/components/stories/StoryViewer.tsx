"use client";

import { useEffect, useState } from "react";
import { FiEye, FiX } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { Emoji } from "@/components/ui/Emoji";
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

  function goNextPerson() {
    if (personIndex < order.length - 1) setPersonIndex((i) => i + 1);
    else onClose();
  }

  function goPrevPerson() {
    if (personIndex > 0) setPersonIndex((i) => i - 1);
    else onClose();
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

  return (
    <div className="chatly-overlay-enter fixed inset-0 z-70 flex flex-col bg-black">
      <div className="flex gap-1 px-2 pt-[calc(var(--safe-top)+0.5rem)]">
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
                  "flex h-9 w-9 items-center justify-center rounded-full p-2 transition-colors",
                  (story.reactions[emoji] ?? []).includes(myUid) ? "bg-white/30" : "bg-white/10 hover:bg-white/20",
                )}
              >
                <Emoji emoji={emoji} />
              </button>
            ))}
          </div>
        )}
      </div>

      {viewersOpen && <StoryViewersModal story={story} profiles={profiles} onClose={() => setViewersOpen(false)} />}
    </div>
  );
}
