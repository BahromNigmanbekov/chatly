export async function fetchLiveKitToken(roomName: string, identity: string, name: string): Promise<string> {
  const res = await fetch("/api/livekit-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomName, identity, name }),
  });
  if (!res.ok) throw new Error("LiveKit token so'rovi muvaffaqiyatsiz");
  const data = (await res.json()) as { token: string };
  return data.token;
}
