"use client";

import type { ReactNode } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

type ShellProps = {
  children: ReactNode;
  hideFooter?: boolean;
  hideSidebar?: boolean;
  fullBleed?: boolean;
  rightPanel?: ReactNode;
};

export function AppShell({ children, hideFooter, fullBleed = true, rightPanel }: ShellProps) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <div className={`flex w-full gap-3 ${fullBleed ? "px-0 py-0" : "px-3 py-3 md:px-4 md:py-4"}`}>
        <div className="min-w-0 flex-1 space-y-4">
          <main className={`animate-rise ${fullBleed ? "min-h-[calc(100vh-60px)] p-4" : "rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] p-3 shadow-[0_20px_34px_rgba(20,83,45,0.08)] md:p-4"}`}>
            {children}
          </main>
          {hideFooter ? null : <Footer />}
        </div>

        {rightPanel ? (
          <aside className="sticky top-[72px] hidden h-[calc(100vh-84px)] w-80 overflow-auto rounded-[20px] border border-[color:var(--border)] bg-[color:var(--card)] p-3 shadow-[0_18px_30px_rgba(20,83,45,0.08)] xl:block">
            {rightPanel}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
