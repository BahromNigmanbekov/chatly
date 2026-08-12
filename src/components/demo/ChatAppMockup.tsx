"use client";

import { useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiChevronDown, FiPaperclip, FiPlus, FiSearch } from "react-icons/fi";
import { HiOutlineVideoCamera } from "react-icons/hi2";
import { IoCall, IoMic, IoPersonCircleOutline, IoSend } from "react-icons/io5";

// ─────────────────────────────────────────────────────────────────────────
// Mock data — no network, no Firebase. Everything below is local state.
// ─────────────────────────────────────────────────────────────────────────

interface MockUser {
  id: string;
  name: string;
  initials: string;
  color: string;
  online: boolean;
}

interface MockMessage {
  id: string;
  chatId: string;
  mine: boolean;
  text: string;
  time: string;
}

// The first 6 double as "story" people (avatars in the collapsing header tray).
// The rest exist purely to give the chat list enough length to actually
// scroll — without real overflow, the collapsing-header behavior in section 3
// can never be seen or tested.
const USERS: MockUser[] = [
  { id: "adison", name: "Adison Lubin", initials: "AL", color: "#4F8DFD", online: true },
  { id: "james", name: "James Vetrovs", initials: "JV", color: "#9B8FE8", online: true },
  { id: "ashlynn", name: "Ashlynn Mango", initials: "AM", color: "#D96BB0", online: false },
  { id: "tatiana", name: "Tatiana Vaccaro", initials: "TV", color: "#6FD3C8", online: true },
  { id: "nolan", name: "Nolan Siphron", initials: "NS", color: "#FBBF24", online: false },
  { id: "mira", name: "Mira Franci", initials: "MF", color: "#F472B6", online: false },
  { id: "diego", name: "Diego Osinski", initials: "DO", color: "#60A5FA", online: true },
  { id: "priya", name: "Priya Malhotra", initials: "PM", color: "#F97316", online: false },
  { id: "lucas", name: "Lucas Bergstrom", initials: "LB", color: "#34D399", online: false },
  { id: "hannah", name: "Hannah Reyes", initials: "HR", color: "#A78BFA", online: true },
  { id: "omar", name: "Omar Fadel", initials: "OF", color: "#FB7185", online: false },
  { id: "sofia", name: "Sofia Contreras", initials: "SC", color: "#2DD4BF", online: false },
  { id: "ethan", name: "Ethan Whitfield", initials: "EW", color: "#FBBF24", online: true },
  { id: "grace", name: "Grace Odumosu", initials: "GO", color: "#F472B6", online: false },
  { id: "kenji", name: "Kenji Watanabe", initials: "KW", color: "#818CF8", online: false },
  { id: "elena", name: "Elena Popescu", initials: "EP", color: "#4ADE80", online: true },
  { id: "marcus", name: "Marcus Deng", initials: "MD", color: "#F87171", online: false },
  { id: "yara", name: "Yara Haddad", initials: "YH", color: "#38BDF8", online: false },
];

const STORY_USERS = USERS.slice(0, 6);

const LAST_MESSAGES: Record<string, { text: string; time: string; unread: number }> = {
  adison: { text: "Do you want to grab coffee this weekend?", time: "Just now", unread: 2 },
  james: { text: "Let me know if you need anything", time: "3:24 PM", unread: 0 },
  ashlynn: { text: "I'll be a little late, hope that's okay", time: "Yesterday", unread: 0 },
  tatiana: { text: "Just saw this and thought of you", time: "Yesterday", unread: 1 },
  nolan: { text: "Hey, are you free later?", time: "Sep 12", unread: 0 },
  mira: { text: "Sure, sounds good", time: "Sep 10", unread: 0 },
  diego: { text: "Sent you the files", time: "Sep 9", unread: 0 },
  priya: { text: "Haha that's hilarious", time: "Sep 8", unread: 3 },
  lucas: { text: "See you tomorrow then", time: "Sep 7", unread: 0 },
  hannah: { text: "Can you review this by EOD?", time: "Sep 6", unread: 0 },
  omar: { text: "Voice message", time: "Sep 5", unread: 0 },
  sofia: { text: "Happy birthday!", time: "Sep 4", unread: 0 },
  ethan: { text: "On my way", time: "Sep 3", unread: 0 },
  grace: { text: "Thanks for the recommendation", time: "Sep 2", unread: 0 },
  kenji: { text: "Let's reschedule to Friday", time: "Sep 1", unread: 0 },
  elena: { text: "Photo", time: "Aug 30", unread: 0 },
  marcus: { text: "Got it, thanks", time: "Aug 29", unread: 0 },
  yara: { text: "Perfect, see you then", time: "Aug 28", unread: 0 },
};

const INITIAL_MESSAGES: MockMessage[] = [
  { id: "m1", chatId: "james", mine: false, text: "It's called Winds of Tomorrow", time: "10:10" },
  {
    id: "m2",
    chatId: "james",
    mine: false,
    text: "The story is super engaging and the characters are so well-written. I ended up binge-watching half the season last night. I think you'd love it — it's got a mix of drama and mystery with a bit of humor too.",
    time: "10:10",
  },
  { id: "m3", chatId: "james", mine: true, text: "That sounds amazing!", time: "10:10" },
  { id: "m4", chatId: "james", mine: true, text: "Where can I watch it?", time: "10:10" },
  { id: "m5", chatId: "james", mine: false, text: "It's on Netflix", time: "10:14" },
  { id: "m6", chatId: "james", mine: false, text: "If you don't have an account, I can share my login so you can check it out", time: "10:14" },
  { id: "m7", chatId: "james", mine: true, text: "That's so nice of you!", time: "10:23" },
  { id: "m8", chatId: "james", mine: true, text: "I'll let you know if I need it. Thanks!", time: "10:23" },
  { id: "m9", chatId: "james", mine: false, text: "No problem", time: "10:24" },
  { id: "m10", chatId: "james", mine: false, text: "Let me know if you need anything", time: "10:24" },
  { id: "a1", chatId: "adison", mine: false, text: "Do you want to grab coffee this weekend?", time: "09:02" },
];

function initialsColor(user: MockUser) {
  return user.color;
}

// ─────────────────────────────────────────────────────────────────────────
// Sidebar: pull-to-reveal mesh header + flat black chat list.
// ─────────────────────────────────────────────────────────────────────────

// Pull-to-reveal header: collapsed (72px, search pill only) by default; only
// grows toward 320px (title + story row) when the user overscrolls past the
// top of the list — like iOS rubber-banding, not a normal scroll-collapse.
const HEADER_MIN = 72;
const HEADER_MAX = 320;

function SidebarAvatar({ user, size }: { user: MockUser; size: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: initialsColor(user), fontSize: size * 0.36 }}
    >
      {user.initials}
    </div>
  );
}

function ChatRow({
  user,
  active,
  onClick,
}: {
  user: MockUser;
  active: boolean;
  onClick: () => void;
}) {
  const meta = LAST_MESSAGES[user.id];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[76px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors ${
        active ? "bg-white/5" : "hover:bg-white/5"
      }`}
    >
      <div className="relative shrink-0">
        <SidebarAvatar user={user} size={52} />
        {user.online && (
          <span
            className="absolute right-0 bottom-0 rounded-full"
            style={{ width: 13, height: 13, background: "#34C759", border: "2.5px solid #000000" }}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-base font-semibold text-white">{user.name}</span>
          <span className="shrink-0 text-xs" style={{ color: "#8E8E93" }}>
            {meta.time}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-[13.5px]" style={{ color: "#8E8E93" }}>
            {meta.text}
          </span>
          {meta.unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-white px-1.5 text-xs font-semibold text-black">
              {meta.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function Sidebar({
  activeChatId,
  onSelectChat,
}: {
  activeChatId: string;
  onSelectChat: (id: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pull, setPull] = useState(0); // 0 → 1
  const [released, setReleased] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function release() {
    setReleased(true);
    setPull(0);
  }

  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    const el = listRef.current;
    if (el && el.scrollTop <= 0 && e.deltaY < 0) {
      setReleased(false);
      setPull((p) => Math.min(p + -e.deltaY / 400, 1));
    }
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(release, 180);
  }

  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    const el = listRef.current;
    const dy = e.touches[0].clientY - startY.current;
    if (el && el.scrollTop <= 0 && dy > 0) {
      setReleased(false);
      setPull(Math.min(dy / 260, 1));
    }
  }

  // easeOutCubic — smooth deceleration as the panel grows.
  const eased = 1 - Math.pow(1 - pull, 3);
  const headerHeight = HEADER_MIN + (HEADER_MAX - HEADER_MIN) * eased;
  const contentOpacity = Math.max((eased - 0.25) / 0.75, 0);

  const visibleUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return USERS;
    return USERS.filter((u) => u.name.toLowerCase().includes(term));
  }, [searchTerm]);

  return (
    <div className="flex h-full w-[360px] shrink-0 flex-col bg-black">
      <div
        style={{ height: headerHeight }}
        className={`mesh-gradient sticky top-0 z-30 overflow-hidden rounded-b-4xl ${
          released ? "transition-[height] duration-[450ms] ease-out" : ""
        }`}
      >
        <div className="flex items-center gap-2 px-5 pt-4">
          <div className="flex h-11 flex-1 items-center gap-2 rounded-full bg-white/15 px-4 backdrop-blur-xl">
            <FiSearch className="h-4.5 w-4.5 shrink-0 text-white/80" aria-hidden />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              aria-label="Qidirish"
              className="no-focus-ring h-full min-w-0 flex-1 border-none bg-transparent text-sm text-white outline-none placeholder:text-white/70 focus:outline-none focus:ring-0 focus-visible:outline-none focus:placeholder:text-white/90"
            />
          </div>
          <button
            type="button"
            aria-label="Ko'proq"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-xl"
          >
            <FiChevronDown className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div
          style={{
            opacity: contentOpacity,
            transform: `translateY(${(1 - eased) * 20}px) scale(${0.94 + eased * 0.06})`,
            pointerEvents: eased > 0.6 ? "auto" : "none",
          }}
          className={released ? "transition-all duration-[450ms] ease-out" : ""}
        >
          <h1 className="text-balance px-5 pt-4 pb-4 text-[34px] font-bold leading-tight tracking-tight text-white">
            Let&apos;s Stay Connected
          </h1>

          <div className="flex gap-4 overflow-x-auto px-5 pb-4">
            <button type="button" className="flex shrink-0 flex-col items-center gap-1">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/50 text-white">
                <FiPlus className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-[11px] text-white/70">Add</span>
            </button>
            {STORY_USERS.map((u) => (
              <div key={u.id} className="flex shrink-0 flex-col items-center gap-1">
                <div className="rounded-full ring-2 ring-white/40">
                  <SidebarAvatar user={u} size={56} />
                </div>
                <span className="max-w-16 truncate text-[11px] text-white/70">{u.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={listRef}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={release}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="flex flex-col gap-0.5 p-2">
          {visibleUsers.map((u) => (
            <ChatRow key={u.id} user={u} active={u.id === activeChatId} onClick={() => onSelectChat(u.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Conversation pane: frosted sticky header over a scrolling gradient body.
// ─────────────────────────────────────────────────────────────────────────

function Bubble({ message }: { message: MockMessage }) {
  return (
    <div className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[62%] rounded-[14px] py-1.75 px-2.75 ${message.mine ? "rounded-br-[5px]" : "rounded-bl-[5px]"}`}
        style={{
          background: message.mine ? "rgba(150,145,175,0.38)" : "rgba(255,255,255,0.42)",
          color: "#2A2A35",
        }}
      >
        <p className="text-[12.5px] leading-snug wrap-anywhere">
          {message.text}
          <span className="ml-1.5 whitespace-nowrap align-bottom" style={{ fontSize: 9.5, opacity: 0.55 }}>
            {message.time}
          </span>
        </p>
      </div>
    </div>
  );
}

function ConversationHeader({ user }: { user: MockUser }) {
  return (
    <div
      className="sticky top-0 z-20 flex items-center gap-3 px-5 py-2.5"
      style={{
        background: "transparent",
        backdropFilter: "blur(20px)",
        border: "none",
        boxShadow: "none",
      }}
    >
      <button type="button" aria-label="Orqaga" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#2A2A35]">
        <FiArrowLeft className="h-5 w-5" aria-hidden />
      </button>
      <SidebarAvatar user={user} size={34} />
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-[15px] font-semibold text-[#2A2A35]">{user.name}</div>
        <div className="truncate text-xs" style={{ color: "#2A2A35", opacity: 0.6 }}>
          {user.online ? "onlayn" : "oxirgi marta ko'rilgan: bugun 09:14"}
        </div>
      </div>
      <button
        type="button"
        aria-label="Qo'ng'iroq"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/12 text-[#2A2A35]"
      >
        <IoCall className="h-3.75 w-3.75" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Video qo'ng'iroq"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/12 text-[#2A2A35]"
      >
        <HiOutlineVideoCamera className="h-3.75 w-3.75" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Profil"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/12 text-[#2A2A35]"
      >
        <IoPersonCircleOutline className="h-3.75 w-3.75" aria-hidden />
      </button>
    </div>
  );
}

function ConversationPane({ user, messages, onSend }: { user: MockUser; messages: MockMessage[]; onSend: (text: string) => void }) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    onSend(text);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  const newGroupFlags = messages.map((m, i) => i > 0 && messages[i - 1].mine !== m.mine);

  return (
    <div
      className="flex h-full min-w-0 flex-1 flex-col"
      style={{ backgroundImage: "linear-gradient(180deg, #DAD9DE 0%, #B9B3D6 45%, #C8D9C4 100%)" }}
    >
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <ConversationHeader user={user} />
        <div className="flex flex-col px-4 pt-2 pb-4">
          {messages.map((m, i) => {
            const newGroup = newGroupFlags[i];
            return (
              <div key={m.id} style={{ marginTop: i === 0 ? 0 : newGroup ? 14 : 4 }}>
                <Bubble message={m} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 px-3 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Fayl biriktirish"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#6B6875] hover:bg-black/5"
          >
            <FiPaperclip className="h-5 w-5" aria-hidden />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Your Message..."
            aria-label="Xabar"
            className="no-focus-ring h-10.5 min-w-0 flex-1 rounded-full border-none px-4 text-sm text-[#2A2A35] outline-none placeholder:text-[#6B6875] focus:outline-none focus:ring-0 focus-visible:outline-none"
            style={{ background: "rgba(255,255,255,0.35)" }}
          />
          <button
            type="button"
            onClick={handleSend}
            aria-label="Yuborish"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: "#3A3845" }}
          >
            {draft.trim() ? <IoSend className="h-4 w-4" aria-hidden /> : <IoMic className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────

export default function ChatAppMockup() {
  const [activeChatId, setActiveChatId] = useState("james");
  const [messages, setMessages] = useState<MockMessage[]>(INITIAL_MESSAGES);

  const activeUser = USERS.find((u) => u.id === activeChatId) ?? USERS[0];
  const activeMessages = messages.filter((m) => m.chatId === activeChatId);

  function handleSend(text: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        chatId: activeChatId,
        mine: true,
        text,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      },
    ]);
  }

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ fontFamily: "var(--font-inter, Inter), -apple-system, 'SF Pro Display', system-ui, sans-serif" }}>
      <Sidebar activeChatId={activeChatId} onSelectChat={setActiveChatId} />
      <ConversationPane user={activeUser} messages={activeMessages} onSend={handleSend} />
    </div>
  );
}
