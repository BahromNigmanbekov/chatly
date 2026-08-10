import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "LiveKit sozlanmagan" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const roomName: string | undefined = body?.roomName;
  const identity: string | undefined = body?.identity;
  const name: string | undefined = body?.name;
  if (!roomName || !identity) {
    return NextResponse.json({ error: "roomName and identity are required" }, { status: 400 });
  }

  const token = new AccessToken(apiKey, apiSecret, { identity, name, ttl: "2h" });
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({ token: await token.toJwt() });
}
