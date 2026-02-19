import type { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function Card({ title, action, children, className }: Props) {
  return (
    <div className={`card ${className || ""}`.trim()}>
      {(title || action) && (
        <div className="card-header">
          {title ? <h3>{title}</h3> : <span />}
          {action}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
