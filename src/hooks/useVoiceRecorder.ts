"use client";

import { useCallback, useRef, useState } from "react";

export function useVoiceRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setRecording(true);
    tickRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 200);
  }, []);

  const cleanup = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setRecording(false);
  }, []);

  /** Resolves with the recorded audio blob + duration in seconds, or null if cancelled/too short. */
  const stop = useCallback((): Promise<{ blob: Blob; durationSec: number } | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) {
        cleanup();
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const durationSec = (Date.now() - startedAtRef.current) / 1000;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        cleanup();
        resolve(durationSec < 1 ? null : { blob, durationSec });
      };
      recorder.stop();
    });
  }, [cleanup]);

  const cancel = useCallback(() => {
    recorderRef.current?.stop();
    cleanup();
  }, [cleanup]);

  return { recording, elapsedMs, start, stop, cancel };
}
