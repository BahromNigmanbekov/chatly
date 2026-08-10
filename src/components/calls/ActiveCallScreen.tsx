"use client";

import { useEffect } from "react";
import {
  isTrackReference,
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-core";
import { Track } from "livekit-client";
import { FiMic, FiMicOff, FiPhoneOff, FiVideo, FiVideoOff } from "react-icons/fi";
import { Avatar } from "@/components/ui/Avatar";
import { CallControlButton } from "@/components/calls/CallControlButton";
import { Spinner } from "@/components/ui/Spinner";
import { useCallTimer } from "@/hooks/useCallTimer";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useCallStore } from "@/store/useCallStore";

function CallTile({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) {
  const name = trackRef.participant.name || trackRef.participant.identity;
  const hasVideo = isTrackReference(trackRef) && !trackRef.publication.isMuted;

  return (
    <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-white/10">
      {hasVideo ? (
        <VideoTrack trackRef={trackRef} className="h-full w-full object-cover" />
      ) : (
        <Avatar name={name} size="lg" />
      )}
      <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">{name}</span>
    </div>
  );
}

function VideoGrid() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const cols = tracks.length <= 1 ? 1 : tracks.length <= 4 ? 2 : 3;

  return (
    <div className="grid h-full gap-2 p-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {tracks.map((t) => (
        <CallTile key={`${t.participant.identity}-${t.source}`} trackRef={t} />
      ))}
    </div>
  );
}

function AudioOnlyView({ peerId, isGroup, duration }: { peerId: string | null; isGroup: boolean; duration: string }) {
  const { profile } = useUserProfile(peerId);
  const remoteParticipants = useRemoteParticipants();

  if (isGroup) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-white">
        <div className="text-lg font-semibold">{remoteParticipants.length + 1} ishtirokchi</div>
        <div className="text-sm text-white/70">{duration}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white">
      <Avatar name={profile?.displayName ?? "..."} photoURL={profile?.photoURL} size="xl" />
      <div className="text-xl font-semibold">{profile?.displayName ?? "..."}</div>
      <div className="text-sm text-white/70">{duration}</div>
    </div>
  );
}

function CallInner() {
  const callType = useCallStore((s) => s.callType);
  const isGroup = useCallStore((s) => s.isGroup);
  const peerId = useCallStore((s) => s.peerId);
  const callStartedAt = useCallStore((s) => s.callStartedAt);
  const setOtherParticipantCount = useCallStore((s) => s.setOtherParticipantCount);
  const markConnected = useCallStore((s) => s.markConnected);
  const room = useRoomContext();
  const remoteParticipants = useRemoteParticipants();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const duration = useCallTimer(callStartedAt);

  useEffect(() => {
    setOtherParticipantCount(remoteParticipants.length);
  }, [remoteParticipants.length, setOtherParticipantCount]);

  useEffect(() => {
    markConnected();
  }, [markConnected]);

  const isVideo = callType === "video";

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden">
        {isVideo ? (
          <VideoGrid />
        ) : (
          <AudioOnlyView peerId={peerId} isGroup={isGroup} duration={duration} />
        )}
        {isVideo && (
          <div className="absolute left-1/2 top-[calc(var(--safe-top)+1rem)] -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white">
            {duration}
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-center gap-5 px-6 py-8"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 1.5rem)" }}
      >
        <CallControlButton
          onClick={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
          active={!isMicrophoneEnabled}
          label={isMicrophoneEnabled ? "Ovozsiz qilish" : "Ovozni yoqish"}
        >
          {isMicrophoneEnabled ? <FiMic className="h-6 w-6" /> : <FiMicOff className="h-6 w-6" />}
        </CallControlButton>

        {isVideo && (
          <CallControlButton
            onClick={() => void localParticipant.setCameraEnabled(!isCameraEnabled)}
            active={!isCameraEnabled}
            label={isCameraEnabled ? "Kamerani o'chirish" : "Kamerani yoqish"}
          >
            {isCameraEnabled ? <FiVideo className="h-6 w-6" /> : <FiVideoOff className="h-6 w-6" />}
          </CallControlButton>
        )}

        <CallControlButton
          onClick={() => void room.disconnect()}
          danger
          large
          label={isGroup ? "Suhbatdan chiqish" : "Qo'ng'iroqni tugatish"}
        >
          <FiPhoneOff className="h-7 w-7" />
        </CallControlButton>
      </div>
    </div>
  );
}

/**
 * Fully custom UI — LiveKit's client SDK connects directly (no vendor
 * iframe), so every pixel here is ours: video grid, avatar tiles, and the
 * control bar. RoomAudioRenderer (LiveKit's own, well-tested component) is
 * the one piece we don't reinvent — it plays every remote participant's
 * audio, covering both video and audio-only calls.
 */
export function ActiveCallScreen() {
  const phase = useCallStore((s) => s.phase);
  const peerId = useCallStore((s) => s.peerId);
  const roomName = useCallStore((s) => s.roomName);
  const livekitToken = useCallStore((s) => s.livekitToken);
  const callType = useCallStore((s) => s.callType);
  const endCall = useCallStore((s) => s.endCall);
  const { profile } = useUserProfile(peerId);

  const isRinging = phase === "outgoing";

  if (isRinging) {
    return (
      <div className="chatly-overlay-enter fixed inset-0 z-70 flex flex-col items-center justify-center gap-3 bg-black text-white">
        <Avatar name={profile?.displayName ?? "..."} photoURL={profile?.photoURL} size="xl" />
        <div className="text-xl font-semibold">{profile?.displayName ?? "..."}</div>
        <div className="text-sm text-white/70">Chaqirilmoqda...</div>
      </div>
    );
  }

  if (!roomName || !livekitToken) {
    return (
      <div className="chatly-overlay-enter fixed inset-0 z-70 flex items-center justify-center bg-black text-white">
        <Spinner className="border-white/30 border-t-white" />
      </div>
    );
  }

  return (
    <div className="chatly-overlay-enter fixed inset-0 z-70 bg-black text-white">
      <LiveKitRoom
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        token={livekitToken}
        connect
        audio
        video={callType === "video"}
        onDisconnected={() => void endCall()}
        className="h-full"
      >
        <RoomAudioRenderer />
        <CallInner />
      </LiveKitRoom>
    </div>
  );
}
