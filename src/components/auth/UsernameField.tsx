"use client";

import { useUsernameAvailability } from "@/hooks/useUsernameAvailability";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

const STATUS_LABEL: Record<string, string> = {
  checking: "Tekshirilmoqda...",
  available: "Bo'sh ✓",
  taken: "Bu username band",
};

const STATUS_COLOR: Record<string, string> = {
  checking: "text-text-muted",
  available: "text-online",
  taken: "text-danger",
};

interface UsernameFieldProps {
  value: string;
  onChange: (value: string) => void;
  ignoreUid?: string;
}

export function UsernameField({ value, onChange, ignoreUid }: UsernameFieldProps) {
  const { status, error } = useUsernameAvailability(value, ignoreUid);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="username" className="text-sm font-medium text-text">
        Username
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
          @
        </span>
        <Input
          id="username"
          name="username"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/^@/, ""))}
          placeholder="n1gmnbkv"
          className="pl-8"
          error={error}
        />
        {status === "checking" && (
          <Spinner className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />
        )}
      </div>
      {!error && status !== "idle" && (
        <span className={`text-xs ${STATUS_COLOR[status] ?? "text-text-muted"}`}>
          {STATUS_LABEL[status]}
        </span>
      )}
      {!error && status === "idle" && (
        <span className="text-xs text-text-muted">
          Lotin harflari, raqamlar, pastki chiziqcha — 5-32 belgi
        </span>
      )}
    </div>
  );
}
