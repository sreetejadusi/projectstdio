"use client";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  full?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  full,
  className,
  ...props
}: Props) {
  const classes = [
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    full ? "btn-full" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      {...props}
    />
  );
}
