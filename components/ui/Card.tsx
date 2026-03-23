import type { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function Card({ title, action, children, className }: Props) {
  return (
    <section className={`rounded-[24px] border border-[color:var(--border)] bg-[color:var(--card)] shadow-[0_16px_40px_rgba(105,83,55,0.08)] ${className || ""}`.trim()}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-[color:var(--border)]/70 px-5 py-4">
          {title ? <h3 className="text-base font-semibold">{title}</h3> : <span />}
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
