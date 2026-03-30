"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { ProblemLanguage, ProblemTestCase, VisualizationStep } from "@/lib/types";

type Props = {
  language: ProblemLanguage;
  code: string;
  testcases: ProblemTestCase[];
};

function stringifyValue(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatException(exception: VisualizationStep["exception"]) {
  if (!exception) {
    return null;
  }

  if (typeof exception === "string") {
    return exception;
  }

  const type =
    typeof exception.type === "string" && exception.type.trim().length > 0
      ? exception.type
      : "Exception";
  const message =
    typeof exception.message === "string" && exception.message.trim().length > 0
      ? exception.message
      : null;

  return message ? `${type}: ${message}` : type;
}

function VariablesBlock({
  title,
  values,
}: {
  title: string;
  values: Record<string, unknown>;
}) {
  const entries = Object.entries(values);

  return (
    <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">{title}</p>
      {entries.length === 0 ? (
        <p className="mt-2 text-xs text-[color:var(--text-secondary)]">Empty</p>
      ) : (
        <div className="mt-3 space-y-2">
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-md bg-[color:var(--card)] p-2">
              <p className="text-xs font-semibold text-[color:var(--text-primary)]">{key}</p>
              <pre className="mt-1 whitespace-pre-wrap font-mono text-xs text-[color:var(--text-secondary)]">
                {stringifyValue(value)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CodeTraceView({
  code,
  activeLine,
}: {
  code: string;
  activeLine: number | null;
}) {
  const lines = code.split("\n");

  return (
    <div className="overflow-auto rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)]">
      <div className="min-w-full font-mono text-xs">
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const active = activeLine === lineNumber;

          return (
            <div
              key={`${lineNumber}-${line}`}
              className={`grid grid-cols-[56px_minmax(0,1fr)] border-b border-[color:var(--border)]/50 ${
                active ? "bg-[color:var(--card)]" : "bg-transparent"
              }`}
            >
              <div className="px-3 py-1.5 text-right text-[color:var(--text-secondary)]">{lineNumber}</div>
              <pre className="overflow-x-auto px-3 py-1.5 text-[color:var(--text-primary)]">{line || " "}</pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ExecutionVisualizer({ language, code, testcases }: Props) {
  const visibleTestcases = useMemo(
    () => testcases.filter((testcase) => testcase.visibility === "visible"),
    [testcases],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [steps, setSteps] = useState<VisualizationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [visibleTestcases.length]);

  useEffect(() => {
    if (!isPlaying || steps.length === 0) {
      return;
    }

    if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    playbackTimerRef.current = window.setTimeout(() => {
      setCurrentStepIndex((previous) => Math.min(previous + 1, steps.length - 1));
    }, 700);

    return () => {
      if (playbackTimerRef.current != null) {
        window.clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    };
  }, [currentStepIndex, isPlaying, steps.length]);

  const selectedTestcase = visibleTestcases[selectedIndex] ?? null;
  const currentStep = steps[currentStepIndex] ?? null;
  const currentException = formatException(currentStep?.exception ?? null);

  const handleVisualize = async () => {
    if (!selectedTestcase) {
      setError("No visible testcase available for visualization.");
      setSteps([]);
      return;
    }

    if (language !== "python") {
      setError("Visualization is currently available for Python only.");
      setSteps([]);
      return;
    }

    setLoading(true);
    setError(null);
    setIsPlaying(false);

    try {
      const trace = await api.visualizeCode({
        language,
        code,
        input: selectedTestcase.input ?? "",
      });

      const nextSteps = trace.steps ?? [];

      if (nextSteps.length === 0) {
        setSteps([]);
        setCurrentStepIndex(0);
        setError("Trace is empty for this testcase.");
        return;
      }

      setSteps(nextSteps);
      setCurrentStepIndex(0);
    } catch (visualizeError) {
      setSteps([]);
      setCurrentStepIndex(0);
      setError(visualizeError instanceof Error ? visualizeError.message : "Visualization failed.");
    } finally {
      setLoading(false);
    }
  };

  if (language !== "python") {
    return (
      <div className="grid h-60 place-items-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--text-secondary)]">
        Visualization is currently available for Python.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">
          Testcase
          <select
            value={selectedIndex}
            onChange={(event) => setSelectedIndex(Number(event.target.value))}
            className="h-9 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm text-[color:var(--text-primary)] outline-none"
          >
            {visibleTestcases.map((testcase, index) => (
              <option key={testcase.id} value={index}>
                {testcase.id}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={handleVisualize} disabled={loading || !selectedTestcase}>
          {loading ? "Visualizing..." : "Visualize"}
        </Button>
        {steps.length > 0 ? (
          <p className="text-xs text-[color:var(--text-secondary)]">
            Step {currentStepIndex + 1} / {steps.length}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="grid h-64 place-items-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--text-secondary)]">
          Building trace...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="grid h-64 place-items-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--error)]">
          {error}
        </div>
      ) : null}

      {!loading && !error && currentStep ? (
        <>
          {currentException ? (
            <div className="rounded-lg border border-[color:var(--error)]/25 bg-[color:var(--surface)] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--error)]">Exception</p>
              <pre className="mt-3 whitespace-pre-wrap rounded-md bg-[color:var(--card)] p-3 font-mono text-xs text-[color:var(--error)]">
                {currentException}
              </pre>
            </div>
          ) : null}

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <CodeTraceView code={code} activeLine={currentStep.line} />

            <div className="grid gap-3">
              <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">Selected Input</p>
                <pre className="mt-3 whitespace-pre-wrap rounded-md bg-[color:var(--card)] p-2 font-mono text-xs text-[color:var(--text-primary)]">
                  {selectedTestcase?.input || "(empty)"}
                </pre>
              </section>

              <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">Stack Frames</p>
                <div className="mt-3 space-y-3">
                  {currentStep.stack.length === 0 ? (
                    <p className="text-xs text-[color:var(--text-secondary)]">No stack frames.</p>
                  ) : (
                    currentStep.stack.map((frame, index) => (
                      <div key={`${frame.func_name}-${index}`} className="rounded-md bg-[color:var(--card)] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-[color:var(--text-primary)]">{frame.func_name}</p>
                          <span className="text-[11px] text-[color:var(--text-secondary)]">
                            line {frame.line ?? "-"}
                          </span>
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-[color:var(--text-secondary)]">
                          {Object.keys(frame.locals).length === 0
                            ? "No locals"
                            : stringifyValue(frame.locals)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <VariablesBlock title="Locals" values={currentStep.locals} />
            <VariablesBlock title="Globals" values={currentStep.globals} />
            <section className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">Heap and Stdout</p>
              <pre className="mt-3 whitespace-pre-wrap rounded-md bg-[color:var(--card)] p-2 font-mono text-xs text-[color:var(--text-secondary)]">
                Heap:
                {"\n"}
                {Object.keys(currentStep.memory).length === 0 ? "Empty" : stringifyValue(currentStep.memory)}
                {"\n\n"}
                Stdout:
                {"\n"}
                {currentStep.stdout || "(empty)"}
              </pre>
            </section>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[color:var(--border)] pt-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex((previous) => Math.max(previous - 1, 0));
              }}
              disabled={currentStepIndex === 0}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setCurrentStepIndex((previous) => Math.min(previous + 1, steps.length - 1));
              }}
              disabled={currentStepIndex >= steps.length - 1}
            >
              Next
            </Button>
            <Button onClick={() => setIsPlaying(true)} disabled={isPlaying || currentStepIndex >= steps.length - 1}>
              Play
            </Button>
            <Button variant="ghost" onClick={() => setIsPlaying(false)} disabled={!isPlaying}>
              Pause
            </Button>
            <span className="text-xs text-[color:var(--text-secondary)]">
              Event: {currentStep.event} • Line {currentStep.line ?? "-"}
            </span>
          </div>
        </>
      ) : null}

      {!loading && !error && !currentStep ? (
        <div className="grid h-64 place-items-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--text-secondary)]">
          Pick a testcase and click Visualize to inspect execution step by step.
        </div>
      ) : null}
    </div>
  );
}
