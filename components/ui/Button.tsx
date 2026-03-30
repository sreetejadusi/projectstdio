"use client";

type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type BaseButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ButtonSize;
  full?: boolean;
};

type ButtonProps = BaseButtonProps & {
  variant?: ButtonVariant;
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-sm",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function BaseButton({
  size = "md",
  full,
  className,
  variantClassName,
  ...props
}: BaseButtonProps & { variantClassName: string }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-50",
        sizeClass[size],
        full && "w-full",
        variantClassName,
        className,
      )}
      {...props}
    />
  );
}

export function FilledButton(props: BaseButtonProps) {
  return (
    <BaseButton
      variantClassName="rounded-2xl border border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--text-primary)] shadow-[0_12px_24px_rgba(34,197,94,0.16)] hover:rounded-full hover:border-[color:var(--primary-hover)] hover:bg-[color:var(--primary-hover)] active:shadow-none"
      {...props}
    />
  );
}

export function RoundedButton(props: BaseButtonProps) {
  return (
    <BaseButton
      variantClassName="rounded-full border-2 border-[color:var(--primary)] bg-[color:var(--card)] text-[color:var(--primary)] shadow-[0_10px_22px_rgba(20,83,45,0.06)] hover:border-[color:var(--primary-hover)] hover:text-[color:var(--primary-hover)] active:translate-y-px active:shadow-[0_6px_16px_rgba(20,83,45,0.08)]"
      {...props}
    />
  );
}

export function TextButton(props: BaseButtonProps) {
  return (
    <BaseButton
      variantClassName="rounded-full border border-transparent bg-transparent text-[color:var(--text-primary)] shadow-none hover:bg-[color:var(--card)] active:bg-[color:var(--card)]"
      {...props}
    />
  );
}

function DangerButton(props: BaseButtonProps) {
  return (
    <BaseButton
      variantClassName="rounded-full border border-[color:var(--error)]/50 bg-[color:var(--error)] text-white shadow-[0_10px_22px_rgba(239,68,68,0.18)] hover:bg-[#dc2626]"
      {...props}
    />
  );
}

export function Button({ variant = "primary", ...props }: ButtonProps) {
  if (variant === "secondary") {
    return <RoundedButton {...props} />;
  }

  if (variant === "ghost") {
    return <TextButton {...props} />;
  }

  if (variant === "danger") {
    return <DangerButton {...props} />;
  }

  return <FilledButton {...props} />;
}
