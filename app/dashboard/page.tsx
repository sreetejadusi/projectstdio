"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { Classroom } from "@/lib/types";

const recommendedProblems = [
  { id: "two-sum", title: "Two Sum", difficulty: "easy", topic: "Arrays" },
  { id: "merge-intervals", title: "Merge Intervals", difficulty: "medium", topic: "Intervals" },
  { id: "lru-cache", title: "LRU Cache", difficulty: "hard", topic: "Design" },
] as const;

const recentSubmissions = [
  { title: "Balanced Parentheses", status: "Accepted", runtime: "42 ms", language: "Python" },
  { title: "Binary Search", status: "Accepted", runtime: "11 ms", language: "Java" },
  { title: "Word Ladder", status: "Wrong Answer", runtime: "-", language: "C" },
] as const;

export default function DashboardPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getClassrooms();
        setClassrooms(data);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const analytics = useMemo(() => {
    const roomCount = classrooms.length;
    const assignedProblems = classrooms.reduce((sum, room) => sum + room.problemsCount, 0);
    return [
      { label: "Problems Solved", value: "148" },
      { label: "Current Streak", value: "21 days" },
      { label: "Accuracy", value: "86.4%" },
      { label: "Time Spent", value: "64h" },
      { label: "Classrooms", value: String(roomCount) },
      { label: "Assigned Problems", value: String(assignedProblems) },
    ];
  }, [classrooms]);

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold">Learning Command Center</h1>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Continue where you left off, review submissions, and manage coursework.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary">Resume Course</Button>
            <Button>Solve Daily Problem</Button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {analytics.map((metric) => (
            <Card key={metric.label} className="bg-gradient-to-b from-white/5 to-transparent">
              <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <Card title="Continue Learning" className="xl:col-span-2">
            <div className="rounded-xl border border-[color:var(--border)] bg-white/80 p-4 shadow-[0_10px_24px_rgba(105,83,55,0.04)]">
              <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">Current path</p>
              <h3 className="mt-1 text-lg font-semibold">Advanced JavaScript Interview Track</h3>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Module 6: Dynamic Programming on Sequences</p>
              <div className="mt-4 h-2 rounded-full bg-[#f2e6d7]">
                <div className="h-full w-[68%] rounded-full bg-[color:var(--primary)]" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button>Continue Module</Button>
                <Button variant="ghost">View Curriculum</Button>
              </div>
            </div>
          </Card>

          <Card title="Daily Streak">
            <div className="space-y-3">
              <p className="text-4xl font-semibold text-[color:var(--success)]">21</p>
              <p className="text-sm text-[color:var(--text-secondary)]">You solved at least one problem each day this week.</p>
              <Button variant="secondary" full>
                Keep Streak Alive
              </Button>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card title="Recommended Problems" action={<Link href="/problems" className="text-xs text-[color:var(--text-secondary)]">View all</Link>}>
            <div className="space-y-3">
              {recommendedProblems.map((problem) => (
                <div key={problem.id} className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--border)] bg-white/80 p-3 shadow-[0_8px_18px_rgba(105,83,55,0.04)]">
                  <div>
                    <p className="text-sm font-medium">{problem.title}</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">{problem.topic}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={problem.difficulty === "easy" ? "success" : problem.difficulty === "medium" ? "warning" : "danger"}>
                      {problem.difficulty}
                    </Badge>
                    <Link className="text-xs text-[color:var(--primary-hover)]" href="/problems">
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Recent Submissions" action={<Link href="/submissions" className="text-xs text-[color:var(--text-secondary)]">History</Link>}>
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <div key={`${submission.title}-${submission.language}`} className="rounded-lg border border-[color:var(--border)] bg-white/80 p-3 shadow-[0_8px_18px_rgba(105,83,55,0.04)]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{submission.title}</p>
                    <Badge tone={submission.status === "Accepted" ? "success" : "danger"}>{submission.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[color:var(--text-secondary)]">{submission.language} • Runtime: {submission.runtime}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Card title="Upcoming Classroom Assignments">
          {loading ? (
            <p className="text-sm text-[color:var(--text-secondary)]">Loading classrooms...</p>
          ) : classrooms.length === 0 ? (
            <p className="text-sm text-[color:var(--text-secondary)]">No classrooms found yet.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {classrooms.map((room) => (
                <Link key={room.id} href={`/classroom/${room.id}`} className="rounded-lg border border-[color:var(--border)] bg-white/80 p-4 shadow-[0_8px_18px_rgba(105,83,55,0.04)] transition hover:border-[color:var(--primary)]/60">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-medium">{room.name}</h3>
                    <Badge tone={room.role === "instructor" ? "success" : "neutral"}>{room.role}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-[color:var(--text-secondary)]">{room.studentsCount} students • {room.problemsCount} assigned problems</p>
                  <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Join code: {room.code}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
