"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FilledButton, RoundedButton } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { ClassroomDetail } from "@/lib/types";

export default function ClassroomPage() {
  const params = useParams();
  const classroomId = params?.id as string;

  const [data, setData] = useState<ClassroomDetail | null>(null);
  const [activeTab, setActiveTab] = useState("assigned");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classroomId) return;

    const load = async () => {
      setLoading(true);
      try {
        const result = await api.getClassroom(classroomId);
        setData(result);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [classroomId]);

  const tabs = useMemo(
    () => [
      { id: "assigned", label: "Assigned Problems" },
      ...(data?.role === "instructor"
        ? [
            { id: "students", label: "Students" },
            { id: "analytics", label: "Analytics" },
          ]
        : []),
    ],
    [data?.role],
  );

  return (
    <AppShell>
      <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Classroom</p>
            <h1 className="mt-1 text-3xl font-semibold">{data?.name ?? "Loading classroom"}</h1>
          </div>
          {data?.role === "instructor" ? (
            <div className="flex gap-2">
              <RoundedButton>Assign Problem Set</RoundedButton>
              <FilledButton>Add Deadline</FilledButton>
            </div>
          ) : null}
        </header>

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {loading ? <p className="text-sm text-[color:var(--text-secondary)]">Loading classroom data...</p> : null}

        {!loading && activeTab === "assigned" ? (
          <Card title="Assigned problems">
            <div className="space-y-3">
              {data?.problems.map((problem) => (
                <div key={problem.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3 shadow-[0_8px_18px_rgba(20,83,45,0.04)]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{problem.title}</p>
                    <p className="mt-1 text-xs text-[color:var(--text-secondary)] line-clamp-2">{problem.prompt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={problem.difficulty === "easy" ? "success" : problem.difficulty === "medium" ? "warning" : "danger"}>
                      {problem.difficulty}
                    </Badge>
                    <Link href={`/problem/${problem.id}?classroomId=${data?.id}`}>
                      <FilledButton size="sm">Solve</FilledButton>
                    </Link>
                  </div>
                </div>
              ))}
              {!data?.problems.length ? <p className="text-sm text-[color:var(--text-secondary)]">No assigned problems yet.</p> : null}
            </div>
          </Card>
        ) : null}

        {!loading && activeTab === "students" && data?.role === "instructor" ? (
          <Card title="Students list">
            <div className="space-y-2">
              {data.students.map((student) => (
                <div key={student.id} className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3 shadow-[0_8px_18px_rgba(20,83,45,0.04)]">
                  <div>
                    <p className="text-sm font-medium">{student.name}</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">{student.email}</p>
                  </div>
                  <Badge tone={student.status === "active" ? "success" : "warning"}>{student.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {!loading && activeTab === "analytics" && data?.role === "instructor" ? (
          <Card title="Instructor analytics">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3 shadow-[0_8px_18px_rgba(20,83,45,0.04)]">
                <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">Submission velocity</p>
                <p className="mt-2 text-lg font-semibold">+18% this week</p>
              </div>
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3 shadow-[0_8px_18px_rgba(20,83,45,0.04)]">
                <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">Late submissions</p>
                <p className="mt-2 text-lg font-semibold">12 students</p>
              </div>
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3 shadow-[0_8px_18px_rgba(20,83,45,0.04)]">
                <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">Avg. attempts/problem</p>
                <p className="mt-2 text-lg font-semibold">2.4</p>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
