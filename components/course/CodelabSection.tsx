"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/utils/http";
import type { ProblemMetadata } from "@/lib/types";

type Props = {
  problemId: string;
};

export function CodelabSection({ problemId }: Props) {
  const [problem, setProblem] = useState<ProblemMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetchApi<{ problem: ProblemMetadata }>(`/api/problems/${problemId}`);
        if (active) {
          setProblem(response.problem);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load practice lab");
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [problemId]);

  return (
    <section className="rounded-[22px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#fffdfa,#fff5e8)] p-5 shadow-[0_12px_28px_rgba(105,83,55,0.05)]">
      <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">Practice Lab</p>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      {problem ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{problem.title}</h3>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{problem.difficulty} practice with guided context</p>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[color:var(--primary)] bg-[color:var(--primary)] px-4 text-sm text-white"
            href={`/problem/${problem.id}`}
          >
            Open Lab
          </Link>
        </div>
      ) : !error ? (
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Loading practice lab...</p>
      ) : null}
    </section>
  );
}
