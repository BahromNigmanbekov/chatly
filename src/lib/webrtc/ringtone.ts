// Synthesized ringtone (no external audio asset needed): a soft two-tone
// chime that repeats, similar in spirit to a classic phone ring but gentler.
let audioCtx: AudioContext | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;

function ring(ctx: AudioContext) {
  const now = ctx.currentTime;
  [660, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.18;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.03);
    gain.gain.linearRampToValueAtTime(0, start + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.35);
  });
}

export function startRingtone() {
  if (typeof window === "undefined" || intervalId) return;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  audioCtx = new Ctor();
  ring(audioCtx);
  intervalId = setInterval(() => audioCtx && ring(audioCtx), 2200);
}

export function stopRingtone() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (audioCtx) {
    void audioCtx.close();
    audioCtx = null;
  }
}
