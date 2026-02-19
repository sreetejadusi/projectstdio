import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";

export function AppShell({
  children,
  hideFooter,
}: {
  children: ReactNode;
  hideFooter?: boolean;
}) {
  return (
    <div className="app-shell">
      <main className="app-main">{children}</main>
      {hideFooter ? null : <Footer />}
    </div>
  );
}
