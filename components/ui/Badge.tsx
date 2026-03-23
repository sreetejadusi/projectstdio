import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
};

const toneClass: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "border-[color:var(--border)] bg-white/80 text-[color:var(--text-secondary)]",
  success: "border-[color:var(--success)]/50 bg-[color:var(--success)]/15 text-emerald-300",
  warning: "border-[color:var(--warning)]/50 bg-[color:var(--warning)]/15 text-amber-300",
  danger: "border-[color:var(--error)]/50 bg-[color:var(--error)]/15 text-red-300",
};

export function Badge({ children, tone = "neutral" }: Props) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] uppercase tracking-wide ${toneClass[tone]}`}>
      {children}
    </span>
  );
}
