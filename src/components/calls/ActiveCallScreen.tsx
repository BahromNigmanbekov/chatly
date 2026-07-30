"use client";

import { useCallback, useRef, useState } from "react";
import { FiMic, FiMicOff, FiPhoneOff, FiRefreshCw, FiVideo, FiVideoOff, FiVolume2 } from "react-icons/fi";
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
 *
 * Also explicitly calls .play() rather than relying solely on the `autoplay`
 * attribute: some browsers (notably Safari, and Chrome after enough time has
 * passed since the last user gesture) silently block autoplay-with-sound —
 * the `<audio>` element sits there with a valid srcObject and never makes a
 * sound. `onBlocked` lets the caller surface a "tap to enable sound" retry,
 * which always succeeds since it runs inside a real click handler.
 */
function useStreamRef<T extends HTMLMediaElement>(stream: MediaStream | null, onBlocked?: () => void) {
  const elRef = useRef<T | null>(null);
  const attach = useCallback(
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
        if (stream) {
          node
            .play()
            .then(() => console.log("[WebRTC]", node.tagName, "play() succeeded"))
            .catch((err) => {
              console.error("[WebRTC]", node.tagName, "play() blocked:", err.name, err.message);
              onBlocked?.();
            });
        }
      }
    },
    [stream, onBlocked],
  );
  return [attach, elRef] as const;
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
  const [localVideoRef] = useStreamRef<HTMLVideoElement>(localStream);
  const [remoteVideoRef] = useStreamRef<HTMLVideoElement>(remoteStream);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [remoteAudioRef, remoteAudioElRef] = useStreamRef<HTMLAudioElement>(remoteStream, () => setAudioBlocked(true));
  const duration = useCallTimer(callStartedAt);

  function retryAudioPlayback() {
    remoteAudioElRef.current
      ?.play()
      .then(() => setAudioBlocked(false))
      .catch((err) => console.error("[WebRTC] retry play() failed:", err.name, err.message));
  }

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

      {audioBlocked && (
        <button
          type="button"
          onClick={retryAudioPlayback}
          className="absolute left-1/2 top-[calc(var(--safe-top)+1rem)] z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-danger px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          <FiVolume2 className="h-4 w-4" />
          Ovozni yoqish
        </button>
      )}

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
          {muted ? <FiMicOff className="h-6 w-6" /> : <FiMic className="h-6 w-6" />}
        </CallControlButton>

        {isVideo && (
          <CallControlButton onClick={toggleCamera} active={cameraOff} label={cameraOff ? "Kamerani yoqish" : "Kamerani o'chirish"}>
            {cameraOff ? <FiVideoOff className="h-6 w-6" /> : <FiVideo className="h-6 w-6" />}
          </CallControlButton>
        )}

        {isVideo && (
          <CallControlButton onClick={() => switchCamera()} label="Kamerani almashtirish" >
            <FiRefreshCw className="h-6 w-6 md:hidden" />
          </CallControlButton>
        )}

        <CallControlButton onClick={endCall} danger label="Qo'ng'iroqni tugatish" large>
          <FiPhoneOff className="h-7 w-7" />
        </CallControlButton>
      </div>
    </div>
  );
}
