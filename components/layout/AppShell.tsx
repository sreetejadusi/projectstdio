"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

type ShellProps = {
  children: ReactNode;
  hideFooter?: boolean;
  hideSidebar?: boolean;
  rightPanel?: ReactNode;
};

type SidebarItem = {
  href: string;
  label: string;
  icon: string;
};

const sidebarItems: SidebarItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "◻" },
  { href: "/problems", label: "Problems", icon: "<>" },
  { href: "/courses", label: "Courses", icon: "▦" },
  { href: "/classrooms", label: "Classrooms", icon: "👥" },
  { href: "/submissions", label: "Submissions", icon: "✓" },
  { href: "/bookmarks", label: "Bookmarks", icon: "★" },
  { href: "/profile", label: "Profile", icon: "◉" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children, hideFooter, hideSidebar, rightPanel }: ShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto flex w-full max-w-[1600px] gap-4 px-3 py-4 md:px-6">
        {hideSidebar ? null : (
          <aside className="sticky top-20 hidden h-[calc(100vh-96px)] w-64 flex-col rounded-[26px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#fffdf8,#fff7eb)] p-3 shadow-[0_16px_34px_rgba(105,83,55,0.06)] lg:flex">
            <p className="px-3 pb-3 text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Workspace</p>
            <nav className="app-scrollbar flex flex-1 flex-col gap-1 overflow-auto pr-1">
              {sidebarItems.map((item) => {
                const active = isItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                      active
                        ? "border border-[#f2d39c] bg-[#fff2d8] text-[color:var(--primary-hover)]"
                        : "border border-transparent text-[color:var(--text-secondary)] hover:bg-[#fff7eb] hover:text-[color:var(--text-primary)]"
                    }`}
                  >
                    <span className="w-7 text-center text-xs text-[color:var(--text-secondary)] group-hover:text-[color:var(--text-primary)]">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        <div className="min-w-0 flex-1 space-y-4">
          <main className="animate-rise rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[0_22px_48px_rgba(105,83,55,0.08)] md:p-6">
            {children}
          </main>
          {hideFooter ? null : <Footer />}
        </div>

        {rightPanel ? (
          <aside className="sticky top-20 hidden h-[calc(100vh-96px)] w-80 overflow-auto rounded-[26px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#fffdf8,#fff7eb)] p-4 shadow-[0_16px_34px_rgba(105,83,55,0.06)] xl:block">
            {rightPanel}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
