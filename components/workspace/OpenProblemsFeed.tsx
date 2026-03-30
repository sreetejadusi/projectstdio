"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { FilledButton, TextButton } from "@/components/ui/Button";
import type {
  OpenProblemCard,
  WorkspaceFocus,
} from "@/components/workspace/WorkspaceHub";

function difficultyTone(difficulty: OpenProblemCard["difficulty"]) {
  if (difficulty === "easy") return "success";
  if (difficulty === "medium") return "warning";
  return "danger";
}

type Props = {
  focus: WorkspaceFocus;
  loading: boolean;
  error: string | null;
  problems: OpenProblemCard[];
  selectedClassroomId: string | null;
  selectedClassroomName: string | null;
};

export function OpenProblemsFeed({
  focus,
  loading,
  error,
  problems,
  selectedClassroomId,
  selectedClassroomName,
}: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2
            className={`text-2xl font-semibold ${
              focus === "problems"
                ? "text-[color:var(--text-primary)]"
                : "text-[color:var(--text-secondary)]"
            }`}
          >
            Problems
          </h2>
          {selectedClassroomName ? (
            <Badge>{selectedClassroomName}</Badge>
          ) : null}
        </div>
      </div>

      <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-3 shadow-[0_24px_44px_rgba(20,83,45,0.08)]">
        {loading ? (
          <div className="space-y-3 p-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`problem-skeleton-${index}`}
                className="h-20 animate-pulse rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[22px] border border-[color:var(--error)]/25 bg-[color:var(--surface)] px-5 py-8 text-sm text-[color:var(--error)]">
            {error}
          </div>
        ) : problems.length === 0 ? (
          <div className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-8 text-sm text-[color:var(--text-secondary)]">
            {selectedClassroomId
              ? "No open problems in this classroom."
              : "No open problems right now."}
          </div>
        ) : (
          <div className="space-y-3">
            {problems.map((problem, index) => {
              const primaryClassroom =
                problem.classrooms.find(
                  (classroom) => classroom.id === selectedClassroomId,
                ) ?? problem.classrooms[0];

              return (
                <article
                  key={problem.id}
                  className="group rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-4 transition hover:-translate-y-0.5 hover:border-[color:var(--primary)]/45 hover:shadow-[0_18px_32px_rgba(20,83,45,0.08)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#22c55e,#86efac)] text-sm font-semibold text-[color:var(--text-primary)]">
                        {index + 1}
                      </span>
                      <div className="min-w-0 space-y-2">
                        <p className="truncate text-lg font-semibold text-[color:var(--text-primary)]">
                          {problem.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={difficultyTone(problem.difficulty)}>
                            {problem.difficulty}
                          </Badge>
                          {problem.classrooms.map((classroom) => (
                            <span
                              key={`${problem.id}-${classroom.id}`}
                              className="rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-1 text-xs text-[color:var(--text-secondary)]"
                            >
                              {classroom.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end lg:self-auto">
                      <Link href={`/classroom/${primaryClassroom.id}`}>
                        <TextButton size="sm">Classroom</TextButton>
                      </Link>
                      <Link
                        href={`/problem/${problem.id}?classroomId=${primaryClassroom.id}`}
                      >
                        <FilledButton size="sm">Solve</FilledButton>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
