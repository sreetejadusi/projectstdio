"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Classroom } from "@/lib/types";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";

export default function DashboardPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getClassrooms();
        setClassrooms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <AppShell>

      <section className="classroom-section">
        <div className="section-header">
          <h2>Your classrooms</h2>
          {loading ? <span className="subtle">Loading...</span> : null}
          {error ? <span className="error">{error}</span> : null}
        </div>
        <div className="classroom-grid">
          {classrooms.map((room) => (
            <div key={room.id} className="classroom-card">
              <div className="classroom-card-head">
                <h3>{room.name}</h3>
                <Badge
                  tone={room.role === "instructor" ? "success" : "neutral"}
                >
                  {room.role}
                </Badge>
              </div>
              <div className="classroom-meta">
                <span>{room.studentsCount} students</span>
                <span>{room.problemsCount} problems</span>
                <span className="muted">Code: {room.code}</span>
              </div>
              <Link
                className="btn btn-ghost btn-sm"
                href={`/classroom/${room.id}`}
              >
                Open classroom
              </Link>
            </div>
          ))}
          {!loading && classrooms.length === 0 ? (
            <div className="empty-state">No classrooms yet.</div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
