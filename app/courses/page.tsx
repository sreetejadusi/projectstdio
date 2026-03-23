"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import type { CourseCatalogItem } from "@/lib/types";

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const result = await api.getCourses();
        if (active) {
          setCourses(result);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load courses");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(135deg,#fff8eb,#fff2f0_45%,#fff9f2)] p-6 shadow-[0_18px_42px_rgba(105,83,55,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Course Library</p>
              <h1 className="mt-2 text-4xl font-semibold leading-tight">Courses that feel approachable, guided, and worth starting today.</h1>
              <p className="mt-3 text-base text-[color:var(--text-secondary)]">
                Browse structured courses with smaller modules, practical labs, and visible momentum instead of overwhelming walls of curriculum.
              </p>
            </div>
            <div className="grid min-w-[220px] gap-3 rounded-[24px] border border-white/70 bg-white/70 p-4 shadow-[0_12px_28px_rgba(105,83,55,0.06)]">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">Why this works</p>
              <p className="text-sm text-[color:var(--text-primary)]">Short modules, clear progress, and practice labs make each course feel like forward motion rather than backlog.</p>
            </div>
          </div>
        </header>

        {error ? (
          <Card title="Unable to load courses">
            <p className="text-sm text-red-300">{error}</p>
          </Card>
        ) : null}

        {loading ? <p className="text-sm text-[color:var(--text-secondary)]">Loading courses...</p> : null}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="group overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#fffdfa,#fff7eb)] p-0 shadow-[0_18px_40px_rgba(105,83,55,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(105,83,55,0.12)]"
            >
              <div className="h-36 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.35),transparent_38%),radial-gradient(circle_at_85%_20%,rgba(251,113,133,0.22),transparent_26%),linear-gradient(135deg,#fff6dd,#fff0dd)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <Badge tone="neutral">{course.difficulty ?? "course"}</Badge>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-[color:var(--text-secondary)]">
                    {course.estimatedHours ?? 0}h
                  </span>
                </div>
                <h2 className="mt-6 text-2xl font-semibold leading-tight">{course.title}</h2>
              </div>

              <div className="p-5">
                <p className="line-clamp-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                  {course.description || "A practical, guided course with concise modules and built-in practice."}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-[color:var(--text-secondary)]">
                  <span>{course.moduleCount} modules</span>
                  <span>{course.topicCount} topics</span>
                  <span>{course.language?.toUpperCase() ?? "GEN"}</span>
                </div>
                <div className="mt-5 h-2 rounded-full bg-[#f2e6d7]">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#fb7185)]" style={{ width: `${course.progressPercent}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-[color:var(--text-secondary)]">Progress: {course.progressPercent}%</p>
                  <span className="text-sm font-medium text-[color:var(--primary-hover)] transition group-hover:translate-x-1">
                    Open course
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {!loading && !error && courses.length === 0 ? (
          <Card title="No published courses">
            <p className="text-sm text-[color:var(--text-secondary)]">No published courses were found in the database.</p>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
