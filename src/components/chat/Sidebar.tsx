"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiPlus, FiSearch } from "react-icons/fi";
import { ChatList } from "@/components/chat/ChatList";
import { StoryTray } from "@/components/stories/StoryTray";
import { useModalStore } from "@/store/useModalStore";

// Pull-to-reveal header: collapsed (72px, search pill only) by default; only
// grows toward 320px (title + story row) when the user overscrolls past the
// top of the list — like iOS rubber-banding, not a normal scroll-collapse.
const HEADER_MIN = 72;
const HEADER_MAX = 320;

export function Sidebar() {
  const setGroupCreateOpen = useModalStore((s) => s.setGroupCreateOpen);
  const [searchTerm, setSearchTerm] = useState("");
  const [pull, setPull] = useState(0); // 0 → 1
  const [released, setReleased] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const dragPull = useRef(0);

  // Desktop mouse-wheel scrolling never drives the panel open/closed — any
  // incidental upward tick at the top of the list (trackpads especially)
  // was popping it open unintentionally during ordinary browsing. Opening
  // is now only ever explicit: the chevron button, or a real touch-drag
  // pull on mobile.
  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    startY.current = e.touches[0].clientY;
    dragPull.current = pull;
  }

  function onTouchEnd() {
    // Snap to fully open or fully closed — never leave it resting half-open.
    setReleased(true);
    setPull((p) => (p > 0.5 ? 1 : 0));
  }

  function toggleOpen() {
    setReleased(true);
    setPull((p) => (p > 0.5 ? 0 : 1));
  }

  // A plain JSX onTouchMove can't reliably preventDefault() — browsers (and
  // React) attach touch listeners as passive by default, so the native
  // scroll kept engaging *alongside* the pull gesture. That let scrollTop
  // drift a few px above 0 during a close, and the "el.scrollTop <= 0" gate
  // below then silently blocked every future re-open attempt. A manually
  // attached, explicitly non-passive listener is the only way to actually
  // take over the gesture.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    function onTouchMoveNative(e: TouchEvent) {
      const dy = e.touches[0].clientY - startY.current;
      if (el!.scrollTop <= 0 && (dy > 0 || dragPull.current > 0)) {
        e.preventDefault();
        setReleased(false); // follow the finger 1:1, no transition lag
        setPull(Math.min(Math.max(dragPull.current + dy / 260, 0), 1));
      }
    }

    el.addEventListener("touchmove", onTouchMoveNative, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMoveNative);
  }, []);

  // easeOutCubic — smooth deceleration as the panel grows.
  const eased = 1 - Math.pow(1 - pull, 3);
  const headerHeight = HEADER_MIN + (HEADER_MAX - HEADER_MIN) * eased;
  const contentOpacity = Math.max((eased - 0.25) / 0.75, 0);

  return (
    <div className="relative flex h-full flex-col bg-bg">
      <div
        style={{ height: headerHeight, paddingTop: "var(--safe-top)" }}
        className={`chat-body-gradient sticky top-0 z-30 overflow-hidden rounded-b-4xl ${
          released ? "transition-[height] duration-450 ease-out" : ""
        }`}
      >
        <div className="flex items-center gap-2 px-4 pt-4">
          <div className="flex h-11 flex-1 items-center gap-2 rounded-full bg-black/6 px-4">
            <FiSearch className="h-4.5 w-4.5 shrink-0 text-black/50" aria-hidden />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              aria-label="Qidirish"
              className="no-focus-ring h-full min-w-0 flex-1 border-none bg-transparent text-sm text-black outline-none placeholder:text-black/40 focus:outline-none focus:ring-0 focus-visible:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={toggleOpen}
            aria-label={pull > 0.5 ? "Yopish" : "Ochish"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/6 text-black"
          >
            <FiChevronDown
              className={`h-5 w-5 transition-transform duration-450 ease-out ${pull > 0.5 ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        </div>

        <div
          style={{
            opacity: contentOpacity,
            transform: `translateY(${(1 - eased) * 20}px) scale(${0.94 + eased * 0.06})`,
            pointerEvents: eased > 0.6 ? "auto" : "none",
          }}
          className={released ? "transition-all duration-450 ease-out" : ""}
        >
          <h1 className="text-balance px-4 pt-4 pb-4 text-[34px] font-bold leading-tight tracking-tight text-black">
            Let&apos;s Stay Connected
          </h1>

          <StoryTray />
        </div>
      </div>

      <div
        ref={listRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <ChatList searchTerm={searchTerm} />
      </div>

      {/* New group — mobile only; desktop uses the IconRail's "+" instead. */}
      <button
        type="button"
        onClick={() => setGroupCreateOpen(true)}
        aria-label="Yangi guruh yaratish"
        className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#cfcce4] text-[#1c1b2e] md:hidden"
      >
        <FiPlus className="h-6 w-6" aria-hidden />
      </button>
    </div>
  );
}
