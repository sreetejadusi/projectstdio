"use client";

import { FilledButton } from "@/components/ui/Button";
import type { Classroom } from "@/lib/types";
import type { WorkspaceFocus } from "@/components/workspace/WorkspaceHub";
import { useRouter } from "next/navigation";

const cardAccents = [
  "from-[color:var(--surface)] via-[color:var(--card)] to-[color:var(--surface)]",
  "from-[color:var(--card)] via-[color:var(--surface)] to-[color:var(--card)]",
  "from-[color:var(--surface)] via-[color:var(--surface)] to-[color:var(--card)]",
];

type Props = {
  classrooms: Classroom[];
  focus: WorkspaceFocus;
  loading: boolean;
  selectedClassroomId: string | null;
};

export function ClassroomStrip({
  classrooms,
  focus,
  loading,
  selectedClassroomId,
}: Props) {
  const router = useRouter();
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1
          className={`text-2xl font-semibold ${
            focus === "classrooms"
              ? "text-[color:var(--text-primary)]"
              : "text-[color:var(--text-secondary)]"
          }`}
        >
          Classrooms
        </h1>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`classroom-skeleton-${index}`}
              className="h-52 animate-pulse rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)]"
            />
          ))}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] px-6 py-10 text-sm text-[color:var(--text-secondary)]">
          No classrooms available.
        </div>
      ) : (
        <div className="app-scrollbar flex snap-x gap-4 overflow-x-auto pb-2">
          {classrooms.map((classroom, index) => {
            const selected = classroom.id === selectedClassroomId;

            return (
              <article
                key={classroom.id}
                className={`min-w-[310px] snap-start rounded-[28px] border p-5 shadow-[0_22px_42px_rgba(20,83,45,0.08)] transition ${
                  selected
                    ? "border-[color:var(--primary)] bg-[linear-gradient(135deg,var(--surface),var(--card))]"
                    : "border-[color:var(--border)] bg-[color:var(--card)] hover:-translate-y-0.5 hover:border-[color:var(--primary)]/40"
                }`}
              >
                <div
                  className={`rounded-[22px] border border-[color:var(--border)] bg-gradient-to-br p-4 ${cardAccents[index % cardAccents.length]}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                        {classroom.name}
                      </h2>
                      <p className="text-sm text-[color:var(--text-secondary)]">
                        {classroom.code}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <FilledButton
                    type="button"
                    size="sm"
                    onClick={() => router.push(`/classroom/${classroom.id}`)}
                  >
                    Open
                  </FilledButton>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
