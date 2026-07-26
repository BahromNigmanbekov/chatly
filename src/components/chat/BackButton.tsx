"use client";

import { useRouter } from "next/navigation";

export function BackButton({ href = "/" }: { href?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      aria-label="Orqaga"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-primary-soft md:hidden"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-text" aria-hidden>
        <path
          d="M15 6l-6 6 6 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
