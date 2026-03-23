import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Workspace Config</p>
          <h1 className="mt-1 text-3xl font-semibold">Settings</h1>
        </header>

        <Card title="Editor Preferences">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm text-[color:var(--text-secondary)]">Tab width
              <select className="h-10 rounded-lg border border-[color:var(--border)] bg-white px-3 text-sm text-[color:var(--text-primary)] outline-none">
                <option>2 spaces</option>
                <option>4 spaces</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm text-[color:var(--text-secondary)]">Default language
              <select className="h-10 rounded-lg border border-[color:var(--border)] bg-white px-3 text-sm text-[color:var(--text-primary)] outline-none">
                <option>Python</option>
                <option>Java</option>
                <option>C</option>
              </select>
            </label>
          </div>
          <div className="mt-4">
            <Button>Save Preferences</Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
