"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ClassroomDetail } from "@/lib/types";
import { AppShell } from "@/components/layout/AppShell";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";

export default function ClassroomPage() {
  const params = useParams();
  const [data, setData] = useState<ClassroomDetail | null>(null);
  const [activeTab, setActiveTab] = useState("problems");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const result = await api.getClassroom(id);
        setData(result);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [params]);

  const tabs = [
    { id: "problems", label: "Problems" },
    ...(data?.role === "instructor"
      ? [{ id: "students", label: "Students" }]
      : []),
  ];

  return (
    <AppShell>
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {loading ? <div className="panel">Loading classroom...</div> : null}

      {!loading && activeTab === "problems" && (
        <section className="classroom-list">
          {data?.problems.map((problem) => (
            <div key={problem.id} className="list-item">
              <div>
                <h3>{problem.title}</h3>
                <p className="muted">{problem.prompt}</p>
              </div>
              <div className="list-actions">
                <Badge
                  tone={
                    problem.difficulty === "easy"
                      ? "success"
                      : problem.difficulty === "medium"
                        ? "warning"
                        : "danger"
                  }
                >
                  {problem.difficulty}
                </Badge>
                <Link
                  className="btn btn-primary btn-sm"
                  href={`/problem/${problem.id}?classroomId=${data?.id}`}
                >
                  Solve
                </Link>
              </div>
            </div>
          ))}
          {data?.problems.length === 0 ? (
            <div className="empty-state">No problems assigned yet.</div>
          ) : null}
        </section>
      )}

      {!loading && activeTab === "students" && data?.role === "instructor" && (
        <section className="classroom-list">
          {data.students.map((student) => (
            <div key={student.id} className="list-item">
              <div>
                <h3>{student.name}</h3>
                <p className="muted">{student.email}</p>
              </div>
              <Badge tone={student.status === "active" ? "success" : "warning"}>
                {student.status}
              </Badge>
            </div>
          ))}
          {data.students.length === 0 ? (
            <div className="empty-state">No students yet.</div>
          ) : null}
        </section>
      )}
    </AppShell>
  );
}
