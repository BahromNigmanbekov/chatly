"use client";

import { FiMoon, FiSun } from "react-icons/fi";
import { useUIStore } from "@/store/useUIStore";

export function ThemeToggle() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-primary-soft"
    >
      {theme === "dark" ? <FiSun className="h-5 w-5" aria-hidden /> : <FiMoon className="h-5 w-5" aria-hidden />}
    </button>
  );
}
