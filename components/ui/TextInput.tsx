"use client";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function TextInput({ label, hint, className, ...props }: Props) {
  return (
    <label className={"field"}>
      {label ? <span className="field-label">{label}</span> : null}
      <input className={`input ${className || ""}`.trim()} {...props} />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
