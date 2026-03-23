import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Learner Profile</p>
          <h1 className="mt-1 text-3xl font-semibold">Sreeteja Dusi</h1>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Backend-leaning learner focused on systems, algorithms, and interview prep.</p>
        </header>

        <section className="grid gap-4 xl:grid-cols-3">
          <Card title="Profile">
            <p className="text-sm text-[color:var(--text-secondary)]">Member since: Jan 2026</p>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Institution: Project Stdio University</p>
          </Card>
          <Card title="Achievements" className="xl:col-span-2">
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">7 Day Streak</Badge>
              <Badge tone="warning">DP Challenger</Badge>
              <Badge tone="neutral">Top 10% Arrays</Badge>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card title="Solved by Topic">
            <ul className="space-y-2 text-sm text-[color:var(--text-secondary)]">
              <li>Arrays: 54</li>
              <li>Recursion: 21</li>
              <li>Dynamic Programming: 18</li>
            </ul>
          </Card>
          <Card title="Difficulty Breakdown">
            <ul className="space-y-2 text-sm text-[color:var(--text-secondary)]">
              <li>Easy: 82</li>
              <li>Medium: 51</li>
              <li>Hard: 15</li>
            </ul>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
