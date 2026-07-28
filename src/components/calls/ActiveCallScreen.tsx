"use client";

import { useCallback, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { CallControlButton } from "@/components/calls/CallControlButton";
import { useCallTimer } from "@/hooks/useCallTimer";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useCallStore } from "@/store/useCallStore";

/**
 * Attaches `stream` to whatever media element this ref is passed to, via a
 * *callback* ref rather than useRef+useEffect. A plain useEffect keyed on
 * `[stream]` only re-runs when the stream value itself changes — if the
 * element mounts *after* the stream was already set (e.g. the caller's local
 * video, which isn't in the DOM yet while still ringing), the effect never
 * fires again and srcObject is never attached. A callback ref runs exactly
 * when the element mounts, using whatever stream is current at that moment,
 * so it's correct regardless of which happens first.
 */
function useStreamRef<T extends HTMLMediaElement>(stream: MediaStream | null) {
  const elRef = useRef<T | null>(null);
  return useCallback(
    (node: T | null) => {
      elRef.current = node;
      if (node) {
        node.srcObject = stream;
        console.log(
          "[WebRTC] attached stream to",
          node.tagName,
          "tracks:",
          stream?.getTracks().map((t) => t.kind) ?? null,
        );
      }
    },
    [stream],
  );
}

export function ActiveCallScreen() {
  const phase = useCallStore((s) => s.phase);
  const peerId = useCallStore((s) => s.peerId);
  const callType = useCallStore((s) => s.callType);
  const localStream = useCallStore((s) => s.localStream);
  const remoteStream = useCallStore((s) => s.remoteStream);
  const muted = useCallStore((s) => s.muted);
  const cameraOff = useCallStore((s) => s.cameraOff);
  const connectionState = useCallStore((s) => s.connectionState);
  const callStartedAt = useCallStore((s) => s.callStartedAt);
  const endCall = useCallStore((s) => s.endCall);
  const toggleMute = useCallStore((s) => s.toggleMute);
  const toggleCamera = useCallStore((s) => s.toggleCamera);
  const switchCamera = useCallStore((s) => s.switchCamera);

  const { profile } = useUserProfile(peerId);
  const localVideoRef = useStreamRef<HTMLVideoElement>(localStream);
  const remoteVideoRef = useStreamRef<HTMLVideoElement>(remoteStream);
  const remoteAudioRef = useStreamRef<HTMLAudioElement>(remoteStream);
  const duration = useCallTimer(callStartedAt);

  const isVideo = callType === "video";
  const isRinging = phase === "outgoing";
  const connectionFailed = connectionState === "failed";

  return (
    <div className="chatly-overlay-enter fixed inset-0 z-[70] flex flex-col bg-black text-white">
      {/*
        Always present regardless of call type or ringing state: this is the
        only element that plays the peer's voice on an audio-only call, and a
        safety net for video calls too (video below is muted to avoid double
        playback, since this element already carries that stream's audio).
      */}
      <audio ref={remoteAudioRef} autoPlay />

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {isVideo && remoteStream && !isRinging ? (
          <video ref={remoteVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Avatar name={profile?.displayName ?? "..."} photoURL={profile?.photoURL} size="xl" />
            <div className="text-xl font-semibold">{profile?.displayName ?? "..."}</div>
            <div className="text-sm text-white/70">
              {connectionFailed
                ? "Ulanib bo'lmadi, qayta urinib ko'ring"
                : isRinging
                  ? "Chaqirilmoqda..."
                  : isVideo
                    ? "Kamera kutilmoqda..."
                    : duration}
          </div>
          </div>
        )}

        {isVideo && !isRinging && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute right-4 top-[calc(var(--safe-top)+1rem)] h-36 w-24 rounded-xl border border-white/20 object-cover shadow-lg sm:h-44 sm:w-32"
          />
        )}

        {isVideo && !isRinging && remoteStream && (
          <div className="absolute left-1/2 top-[calc(var(--safe-top)+1rem)] -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs">
            {duration}
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-center gap-5 px-6 py-8"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 1.5rem)" }}
      >
        <CallControlButton onClick={toggleMute} active={muted} label={muted ? "Ovozni yoqish" : "Ovozsiz qilish"}>
          {muted ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path d="M9.5 9a2.5 2.5 0 015 0v3a2.5 2.5 0 01-.2 1M12 15a3 3 0 01-3-3M3 3l18 18M17 12a5 5 0 01-1 3M12 18v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0M12 18v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          )}
        </CallControlButton>

        {isVideo && (
          <CallControlButton onClick={toggleCamera} active={cameraOff} label={cameraOff ? "Kamerani yoqish" : "Kamerani o'chirish"}>
            {cameraOff ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path d="M3 3l18 18M16 8h1.5A1.5 1.5 0 0119 9.5v5c0 .3-.06.6-.17.86M15 16H5.5A1.5 1.5 0 014 14.5v-5A1.5 1.5 0 015.5 8H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 10l3-2v8l-3-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <rect x="4" y="8" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M19 10l3-2v8l-3-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </CallControlButton>
        )}

        {isVideo && (
          <CallControlButton onClick={() => switchCamera()} label="Kamerani almashtirish" >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 md:hidden">
              <path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M9 17a4 4 0 118-1M17 12l1 3-3-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </CallControlButton>
        )}

        <CallControlButton onClick={endCall} danger label="Qo'ng'iroqni tugatish" large>
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
            <path
              d="M4.5 15.5c1-3 4-5 7.5-5s6.5 2 7.5 5c.3.9-.2 1.9-1.1 2.1l-2.6.7a1.7 1.7 0 01-1.8-.6l-1-1.3a8 8 0 00-2 0l-1 1.3a1.7 1.7 0 01-1.8.6l-2.6-.7c-.9-.2-1.4-1.2-1.1-2.1z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
              transform="rotate(135 12 12)"
            />
          </svg>
        </CallControlButton>
      </div>
    </div>
  );
}
