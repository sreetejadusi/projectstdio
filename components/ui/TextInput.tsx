"use client";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function TextInput({ label, hint, className, ...props }: Props) {
  return (
    <label className="grid gap-1.5">
      {label ? <span className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">{label}</span> : null}
      <input
        className={[
          "h-10 rounded-lg border border-[color:var(--border)] bg-white px-3 text-sm text-[color:var(--text-primary)] outline-none transition placeholder:text-[color:var(--text-secondary)] focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--ring)]",
          className || "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {hint ? <span className="text-xs text-[color:var(--text-secondary)]">{hint}</span> : null}
    </label>
  );
}
