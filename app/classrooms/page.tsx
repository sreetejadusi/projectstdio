"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import type { Classroom } from "@/lib/types";

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await api.getClassrooms();
      setClassrooms(data);
    };

    void load();
  }, []);

  return (
    <AppShell>
      <div className="space-y-5">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">B2B Workspace</p>
          <h1 className="mt-1 text-3xl font-semibold">Classrooms</h1>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Manage cohorts, assigned sets, submissions, and instructor analytics.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classrooms.map((room) => (
            <Card key={room.id} title={room.name} action={<Badge tone={room.role === "instructor" ? "success" : "neutral"}>{room.role}</Badge>} className="bg-white/80">
              <p className="text-sm text-[color:var(--text-secondary)]">{room.studentsCount} students • {room.problemsCount} problems</p>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Code: {room.code}</p>
              <Link href={`/classroom/${room.id}`} className="mt-4 inline-block text-sm text-[color:var(--primary-hover)]">Open classroom</Link>
            </Card>
          ))}
          {classrooms.length === 0 ? <p className="text-sm text-[color:var(--text-secondary)]">No classrooms yet.</p> : null}
        </section>
      </div>
    </AppShell>
  );
}
