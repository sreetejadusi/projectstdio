"use client";

import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";

export function TopNav() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)]/70 bg-[color:var(--surface)]/90 backdrop-blur">
      <div className="flex h-[60px] w-full items-center gap-3 px-3 md:px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img src="/logo.svg" alt="FrogMatrix" className="w-1/8" />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--border)] bg-[color:var(--card)] text-sm text-[color:var(--text-primary)] transition hover:border-[color:var(--primary)]"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <Link
            href="/profile"
            className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--border)] bg-[color:var(--card)] text-xs font-semibold text-[color:var(--text-primary)]"
            aria-label="Profile"
          >
            FM
          </Link>
        </div>
      </div>
    </header>
  );
}
