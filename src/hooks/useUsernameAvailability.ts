"use client";

import { useEffect, useState } from "react";
import { isUsernameAvailable } from "@/lib/firebase/auth";
import { isValidUsername, usernameValidationError } from "@/lib/utils/username";

export type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function useUsernameAvailability(username: string, ignoreUid?: string) {
  const [status, setStatus] = useState<AvailabilityStatus>("idle");

  useEffect(() => {
    if (username.trim().length === 0) {
      setStatus("idle");
      return;
    }

    if (!isValidUsername(username)) {
      setStatus("invalid");
      return;
    }

    let cancelled = false;
    setStatus("checking");

    const timeout = setTimeout(async () => {
      const available = await isUsernameAvailable(username, ignoreUid);
      if (!cancelled) setStatus(available ? "available" : "taken");
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [username, ignoreUid]);

  const error = status === "invalid" ? usernameValidationError(username) : null;

  return { status, error };
}
