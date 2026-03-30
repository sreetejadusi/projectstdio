import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";

const saved = ["Longest Substring", "Kth Largest Element", "Topological Sort"];

export default function BookmarksPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Saved Work</p>
          <h1 className="mt-1 text-3xl font-semibold">Bookmarks</h1>
        </header>

        <Card>
          <div className="space-y-3">
            {saved.map((title) => (
              <div key={title} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3 shadow-[0_8px_18px_rgba(20,83,45,0.04)]">
                <p className="text-sm font-medium">{title}</p>
                <Link href="/problems" className="mt-1 inline-block text-xs text-[color:var(--primary-hover)]">Open in problems</Link>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
