"use client";

import { JitsiMeeting } from "@jitsi/react-sdk";
import { useAuthStore } from "@/store/useAuthStore";
import { useCallStore } from "@/store/useCallStore";

/**
 * Jitsi's own in-iframe UI supplies the entire in-call experience (mic/camera
 * toggle, hang up, grid view for group calls) — there's no custom control bar
 * to build or keep in sync here. This component just mounts the meeting and
 * wires its lifecycle events back into useCallStore (see setJitsiApi).
 */
export function ActiveCallScreen() {
  const jitsiRoomName = useCallStore((s) => s.jitsiRoomName);
  const callType = useCallStore((s) => s.callType);
  const setJitsiApi = useCallStore((s) => s.setJitsiApi);
  const displayName = useAuthStore((s) => s.profile?.displayName) ?? "Foydalanuvchi";

  if (!jitsiRoomName) return null;

  return (
    <div className="chatly-overlay-enter fixed inset-0 z-70 bg-black">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={jitsiRoomName}
        userInfo={{ displayName, email: "" }}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: callType === "audio",
          startAudioOnly: callType === "audio",
          disableModeratorIndicator: true,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          disableInviteFunctions: true,
          toolbarButtons: ["microphone", "camera", "hangup", "tileview", "fullscreen"],
        }}
        interfaceConfigOverwrite={{
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          MOBILE_APP_PROMO: false,
        }}
        getIFrameRef={(iframeEl) => {
          iframeEl.style.height = "100%";
          iframeEl.style.width = "100%";
        }}
        onApiReady={setJitsiApi}
      />
    </div>
  );
}
