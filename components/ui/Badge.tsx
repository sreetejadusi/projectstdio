import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
};

const toneClass: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--text-secondary)]",
  success: "border-[color:var(--success)]/35 bg-[color:var(--success)]/12 text-[color:var(--text-primary)]",
  warning: "border-[color:var(--warning)]/45 bg-[color:var(--warning)]/18 text-[#8a6b00]",
  danger: "border-[color:var(--error)]/35 bg-[color:var(--error)]/12 text-[color:var(--error)]",
};

export function Badge({ children, tone = "neutral" }: Props) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] uppercase tracking-wide ${toneClass[tone]}`}>
      {children}
    </span>
  );
}
