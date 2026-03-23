"use client";

import type { ReactNode } from "react";

type Tab = {
  id: string;
  label: string;
};

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  actions?: ReactNode;
};

export function Tabs({ tabs, active, onChange, actions }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white/80 p-1 shadow-[0_8px_18px_rgba(105,83,55,0.05)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              active === tab.id
                ? "bg-[color:var(--primary)] text-white"
                : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            }`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {actions}
    </div>
  );
}
