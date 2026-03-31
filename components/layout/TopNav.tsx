"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { fetchApi } from "@/lib/utils/http";

type SessionData = {
  userId: string;
  fullName: string;
  email: string;
  role: "student" | "instructor" | "admin";
  organizationId?: string;
};

export function TopNav() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const currentSession = await fetchApi<SessionData>("/api/auth/session");
        if (!cancelled) {
          setSession(currentSession);
        }
      } catch {
        if (!cancelled) {
          router.replace("/auth");
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const initials = useMemo(() => {
    if (!session?.fullName) {
      return "FM";
    }

    return session.fullName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [session?.fullName]);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await fetchApi<{ loggedOut: true }>("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // no-op, we still redirect to auth to reset the client state
    } finally {
      router.replace("/auth");
      router.refresh();
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)]/70 bg-[color:var(--surface)]/90 backdrop-blur">
      <div className="flex h-[60px] w-full items-center gap-3 px-3 md:px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img src="/logo.svg" alt="FrogMatrix" className="w-1/8" />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {session ? (
            <div className="hidden items-center gap-3 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-1.5 md:flex">
              <div className="text-right">
                <p className="text-xs font-semibold text-[color:var(--text-primary)]">{session.fullName}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                  {session.role}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--text-primary)] transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loggingOut ? "Signing out..." : "Logout"}
              </button>
            </div>
          ) : null}
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
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
}
