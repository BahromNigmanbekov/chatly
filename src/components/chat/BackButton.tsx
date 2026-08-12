"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

export function BackButton({ href = "/" }: { href?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      aria-label="Orqaga"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10 md:hidden"
    >
      <FiArrowLeft className="h-5 w-5 text-text" aria-hidden />
    </button>
  );
}
