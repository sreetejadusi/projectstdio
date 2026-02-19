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
    <div className="tabs">
      <div className="tabs-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${active === tab.id ? "tab-active" : ""}`}
            onClick={() => onChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      {actions ? <div className="tabs-actions">{actions}</div> : null}
    </div>
  );
}
