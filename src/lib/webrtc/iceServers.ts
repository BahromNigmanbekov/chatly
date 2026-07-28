/**
 * STUN is always available (free, no signup, Google's public server). TURN is
 * optional but strongly recommended for production — without it, calls fail
 * for the ~8-10% of users behind restrictive NATs/firewalls that STUN alone
 * can't traverse. Configure via env vars once you have TURN credentials
 * (see the setup instructions given at the end of this feature).
 */
export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrl.split(",").map((u) => u.trim()),
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return servers;
}
