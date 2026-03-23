"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
};

const links: NavLink[] = [
  { href: "/problems", label: "Problems" },
  { href: "/courses", label: "Courses" },
  { href: "/dashboard", label: "Practice" },
  { href: "/classrooms", label: "Classroom" },
  { href: "/profile", label: "Profile" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)]/80 bg-[color:var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-4 px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#fb7185)] text-sm font-bold text-white shadow-[0_10px_24px_rgba(245,158,11,0.24)]">S</span>
          <div>
            <p className="text-sm font-semibold tracking-wide">STDIO</p>
            <p className="-mt-0.5 text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Learn with momentum</p>
          </div>
        </Link>

        <label className="hidden flex-1 items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-sm text-[color:var(--text-secondary)] shadow-[0_6px_18px_rgba(105,83,55,0.05)] md:flex">
          <span aria-hidden>⌘K</span>
          <input
            className="w-full bg-transparent text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-secondary)]"
            placeholder="Search courses, problems, classrooms"
            type="search"
          />
        </label>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-[#fff2d8] text-[color:var(--primary-hover)]"
                    : "text-[color:var(--text-secondary)] hover:bg-[#fff7eb] hover:text-[color:var(--text-primary)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--border)] bg-white text-sm text-[color:var(--text-secondary)] transition hover:bg-[#fff7eb] hover:text-[color:var(--text-primary)]"
            aria-label="Notifications"
          >
            🔔
          </button>
          <Link
            href="/profile"
            className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--border)] bg-[#fff2d8] text-xs font-semibold text-[color:var(--primary-hover)]"
            aria-label="Profile"
          >
            ST
          </Link>
        </div>
      </div>
    </header>
  );
}
