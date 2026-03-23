"use client";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  full?: boolean;
};

const variantClass: Record<NonNullable<Props["variant"]>, string> = {
  primary: "border border-[color:var(--primary)] bg-[color:var(--primary)] text-white shadow-[0_10px_25px_rgba(217,119,6,0.18)] hover:bg-[color:var(--primary-hover)]",
  secondary:
    "border border-[color:var(--border)] bg-white text-[color:var(--text-primary)] hover:bg-[#fff7eb]",
  ghost:
    "border border-transparent bg-transparent text-[color:var(--text-secondary)] hover:border-[color:var(--border)] hover:bg-[#fff7eb] hover:text-[color:var(--text-primary)]",
  danger: "border border-[color:var(--error)]/60 bg-[color:var(--error)]/15 text-[color:var(--error)] hover:bg-[color:var(--error)]/30",
};

const sizeClass: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  full,
  className,
  ...props
}: Props) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        full ? "w-full" : "",
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
