"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { ProblemSolveData, RunResult, SubmitResult } from "@/lib/types";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MonacoCodeEditor } from "@/components/editor/MonacoCodeEditor";
import { FlowchartPanel } from "@/components/flow/FlowchartPanel";
import { useBehaviorTracking } from "@/hooks/useBehaviorTracking";

type LeftTab = "problem" | "testcases" | "flowchart" | "submissions";
type ExecutionUiState = "idle" | "queued" | "running" | "completed" | "timeout";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toInlineMarkdownHtml(value: string) {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function markdownToHtml(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  let html = "";
  let inList = false;
  let inCode = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      html += inCode ? "</code></pre>" : "<pre><code>";
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      html += `${escapeHtml(line)}\n`;
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${toInlineMarkdownHtml(trimmed.slice(2))}</li>`;
      continue;
    }

    if (inList) {
      html += "</ul>";
      inList = false;
    }

    if (trimmed.startsWith("### ")) {
      html += `<h3>${toInlineMarkdownHtml(trimmed.slice(4))}</h3>`;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      html += `<h2>${toInlineMarkdownHtml(trimmed.slice(3))}</h2>`;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      html += `<h1>${toInlineMarkdownHtml(trimmed.slice(2))}</h1>`;
      continue;
    }

    if (trimmed.length === 0) {
      html += "<br/>";
      continue;
    }

    html += `<p>${toInlineMarkdownHtml(trimmed)}</p>`;
  }

  if (inList) html += "</ul>";
  if (inCode) html += "</code></pre>";

  return html;
}

export default function ProblemSolvePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tracking = useBehaviorTracking();

  const [problem, setProblem] = useState<ProblemSolveData | null>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("problem");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<"python" | "c" | "java">("python");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionUiState>("idle");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorHeight, setEditorHeight] = useState(460);

  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(460);
  const classroomId = searchParams.get("classroomId") ?? undefined;

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;

    const load = async () => {
      setError(null);
      try {
        const data = await api.getProblemSolveData(id, { classroomId });
        setProblem(data);
        setLanguage(data.selectedLanguage);
        setCode(data.baseCode || "");
        setRunResult(null);
        setExecutionState("idle");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load problem");
      }
    };

    void load();
  }, [classroomId, params]);

  useEffect(() => {
    const id = params?.id as string;
    if (!id || !problem) return;

    const loadLanguage = async () => {
      try {
        const data = await api.getProblemSolveData(id, { classroomId, language });
        setProblem(data);
        setCode(data.baseCode || "");
        setRunResult(null);
        setExecutionState("idle");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load runtime");
      }
    };

    if (language !== problem.selectedLanguage) {
      void loadLanguage();
    }
  }, [classroomId, language, params, problem]);

  const startResize = (event: React.MouseEvent<HTMLDivElement>) => {
    // event.preventDefault();
    resizeStartYRef.current = event.clientY;
    resizeStartHeightRef.current = editorHeight;

    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - resizeStartYRef.current;
      const nextHeight = Math.min(
        Math.max(resizeStartHeightRef.current + deltaY, 320),
        Math.floor(window.innerHeight * 0.75),
      );
      setEditorHeight(nextHeight);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const visibleTestcases = useMemo(
    () => (problem?.testcases ?? []).filter((test) => test.visibility === "visible"),
    [problem],
  );

  const renderedDescription = useMemo(
    () => markdownToHtml(problem?.descriptionMarkdown || ""),
    [problem],
  );

  const submissionOutput = useMemo(() => {
    if (!submitResult) return "Submission has not been created yet.";
    return [
      `Submission ID: ${submitResult.submissionId}`,
      `Language: ${submitResult.language}`,
      `Code Path: ${submitResult.submissionCodePath}`,
      `Data Path: ${submitResult.submissionDataFilePath}`,
    ].join("\n");
  }, [submitResult]);

  const testcaseChecksById = useMemo(() => {
    const checks = visibleTestcases.map((test, index) => {
      const result = runResult?.result;
      let passed = false;
      if (runResult?.status === "completed") {
        if (result?.status === "Accepted") {
          passed = true;
        } else if (result?.status === "Wrong Answer" && typeof result.failedTestCase === "number") {
          passed = index + 1 !== result.failedTestCase;
        }
      }
      return {
        id: test.id,
        expectedOutput: test.expectedOutput,
        actualOutput: result?.got ?? "",
        passed,
      };
    });
    return new Map(checks.map((check) => [check.id, check]));
  }, [runResult, visibleTestcases]);

  const runOutput = useMemo(() => {
    if (executionState === "timeout") return "Execution timed out after 60 seconds.";
    if (!runResult) return "Run has not been executed yet.";
    if (runResult.status === "queued" || runResult.status === "running") {
      return `Execution ${runResult.status}...`;
    }
    if (runResult.status === "failed") {
      return runResult.result?.error || "Execution failed.";
    }
    if (!runResult.result) {
      return "Execution completed, but verdict is unavailable.";
    }
    return [
      `Status: ${runResult.result.status}`,
      `Passed: ${runResult.result.passed ?? 0}/${runResult.result.total ?? 0}`,
      runResult.result.error ? `Error: ${runResult.result.error}` : null,
      runResult.result.expected ? `Expected: ${runResult.result.expected}` : null,
      runResult.result.got ? `Got: ${runResult.result.got}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }, [executionState, runResult]);

  const statusBadge = useMemo(() => {
    if (executionState === "queued") return { label: "Queued", tone: "warning" as const };
    if (executionState === "running") return { label: "Running", tone: "warning" as const };
    if (executionState === "timeout") return { label: "Timed Out", tone: "danger" as const };
    if (runResult?.result?.status === "Accepted") return { label: "Accepted", tone: "success" as const };
    if (runResult?.status === "completed" || runResult?.status === "failed") {
      return { label: runResult.result?.status ?? "Error", tone: "danger" as const };
    }
    return { label: "Idle", tone: "neutral" as const };
  }, [executionState, runResult]);

  const tabClass = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm ${
      active
        ? "border-sky-300/70 bg-sky-500/20 text-white"
        : "border-slate-400/30 bg-slate-900/60 text-slate-300"
    }`;

  const handleSubmit = async () => {
    const id = params?.id as string;
    if (!problem || !id || !classroomId) {
      setError("Classroom context is required to submit.");
      return;
    }

    setSubmitting(true);
    tracking.recordRun();

    try {
      const result = await api.submitCode(id, classroomId, language, code);
      setSubmitResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRun = async () => {
    if (!problem) {
      setError("Problem is not loaded.");
      return;
    }

    console.info("[run] step 1: preparing execution request", {
      language,
      testcaseCount: problem.testcases.length,
    });
    setRunResult(null);
    setExecutionState("queued");
    setRunning(true);
    setError(null);
    tracking.recordRun();

    try {
      console.info("[run] step 2: sending execute request");
      const result = await api.runCodeWithPolling(language, code, problem.testcases, {
        pollIntervalMs: 2000,
        maxPollAttempts: 30,
        onUpdate: (update) => {
          setRunResult((prev) => ({
            executionId: update.executionId ?? prev?.executionId,
            language: update.language ?? prev?.language ?? language,
            status: update.status,
            createdAt: update.createdAt ?? prev?.createdAt,
            progress: update.progress ?? prev?.progress,
            result: update.result ?? prev?.result,
            tests: [],
          }));
          if (update.status === "queued") setExecutionState("queued");
          if (update.status === "running") setExecutionState("running");
          if (update.status === "completed" || update.status === "failed") setExecutionState("completed");
        },
      });
      console.info("[run] step 3: execution result received", {
        executionId: result.executionId,
        status: result.status,
        verdict: result.result?.status,
      });
      setRunResult(result);
      const total = result.result?.total ?? problem.testcases.length;
      const passed = result.result?.passed ?? 0;
      const failureCount = Math.max(total - passed, 0);
      if (failureCount > 0) {
        console.info("[run] step 4: recording test failures", { failureCount });
        tracking.recordTestFailure(failureCount);
      }
    } catch (err) {
      console.error("[run] failed", err);
      const message = err instanceof Error ? err.message : "Failed to run code";
      if (message.includes("timed out")) {
        setExecutionState("timeout");
      }
      setError(message);
    } finally {
      console.info("[run] step 5: run flow finished");
      setRunning(false);
    }
  };

  return (
    <AppShell hideFooter>
      <section className="mb-5 rounded-[18px] border border-slate-400/20 bg-[linear-gradient(120deg,rgba(15,23,42,0.95),rgba(15,23,42,0.72))] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Problem Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-50">
              {problem?.title ?? "Loading problem"}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {classroomId ? `Classroom: ${classroomId}` : "Open in classroom context to submit."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {problem ? (
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
            ) : null}
            <Badge tone="neutral">{language.toUpperCase()}</Badge>
            <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
          </div>
        </div>
      </section>

      <div className="grid min-h-[calc(100vh-280px)] grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-[18px] border border-slate-400/20 bg-[linear-gradient(170deg,rgba(15,23,42,0.88),rgba(15,23,42,0.62))] shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
          <div className="flex items-start justify-between gap-3 border-b border-slate-400/20 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Problem Details</h2>
              {error ? <p className="mt-1 text-sm text-rose-400">{error}</p> : null}
            </div>
          </div>

          <div className="flex gap-2 border-b border-slate-400/20 px-5 py-3" role="tablist" aria-label="Problem panels">
            <button
              type="button"
              className={tabClass(leftTab === "problem")}
              onClick={() => setLeftTab("problem")}
            >
              Problem
            </button>
            <button
              type="button"
              className={tabClass(leftTab === "testcases")}
              onClick={() => setLeftTab("testcases")}
            >
              Testcases
            </button>
            <button
              type="button"
              className={tabClass(leftTab === "flowchart")}
              onClick={() => setLeftTab("flowchart")}
            >
              Flowchart
            </button>
            <button
              type="button"
              className={tabClass(leftTab === "submissions")}
              onClick={() => setLeftTab("submissions")}
            >
              Submissions
            </button>
          </div>

          {leftTab === "problem" ? (
            <div className="flex max-h-[calc(100vh-320px)] flex-col gap-4 overflow-auto p-5">
              <article
                className="rounded-xl border border-slate-400/20 bg-slate-950/60 p-4 text-slate-100
                  [&_h1]:mb-2 [&_h1]:text-xl [&_h2]:mb-2 [&_h2]:text-lg [&_h3]:mb-2 [&_h3]:text-base
                  [&_p]:mb-2 [&_pre]:mb-2 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-slate-950 [&_pre]:p-3
                  [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_code]:font-mono"
                dangerouslySetInnerHTML={{ __html: renderedDescription }}
              />

              <div className="rounded-xl border border-slate-400/20 bg-slate-950/50 p-4">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-200">Constraints</h3>
                <p className="text-slate-300">{problem?.constraints || "No constraints provided."}</p>
              </div>
            </div>
          ) : leftTab === "testcases" ? (
            <div className="flex max-h-[calc(100vh-320px)] flex-col gap-4 overflow-auto p-5">
              <div className="rounded-xl border border-slate-400/20 bg-slate-950/50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-200">Visible Test Cases</h3>
                <div className="flex flex-col gap-3">
                  {visibleTestcases.map((test) => (
                    <div key={test.id} className="rounded-lg border border-slate-400/20 bg-slate-900/50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-200">{test.id}</span>
                        <div className="flex items-center gap-2">
                          <Badge tone="neutral">Visible</Badge>
                          {runResult?.status === "completed" ? (
                            <Badge
                              tone={
                                testcaseChecksById.get(test.id)?.passed
                                  ? "success"
                                  : "danger"
                              }
                            >
                              {testcaseChecksById.get(test.id)?.passed
                                ? "Pass"
                                : "Fail"}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">Input</label>
                          <pre className="min-h-14 whitespace-pre-wrap rounded-lg border border-slate-400/15 bg-slate-950/70 p-2 text-xs text-slate-100">{test.input || "(empty)"}</pre>
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">Expected Output</label>
                          <pre className="min-h-14 whitespace-pre-wrap rounded-lg border border-slate-400/15 bg-slate-950/70 p-2 text-xs text-slate-100">{test.expectedOutput || "(empty)"}</pre>
                        </div>
                      </div>
                      {runResult ? (
                        <div className="mt-2">
                          <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">Actual Output</label>
                          <pre className="min-h-14 whitespace-pre-wrap rounded-lg border border-slate-400/15 bg-slate-950/70 p-2 text-xs text-slate-100">
                            {runResult.result?.got || runResult.result?.error || "(empty)"}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {visibleTestcases.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-400/30 p-4 text-center text-sm text-slate-400">
                      No visible test cases in metadata.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : leftTab === "flowchart" ? (
            <div className="h-[calc(100vh-320px)] p-5">
              <FlowchartPanel data={problem?.flowchart ?? null} />
            </div>
          ) : (
            <div className="flex max-h-[calc(100vh-320px)] flex-col gap-4 overflow-auto p-5">
              <div className="rounded-xl border border-slate-400/20 bg-slate-950/50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-200">Submission</h3>
                <pre className="whitespace-pre-wrap rounded-lg border border-slate-400/20 bg-slate-950/70 p-3 font-mono text-xs text-slate-100">
                  {submissionOutput}
                </pre>
              </div>

              <div className="rounded-xl border border-slate-400/20 bg-slate-950/50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-200">Run Result</h3>
                <pre className="whitespace-pre-wrap rounded-lg border border-slate-400/20 bg-slate-950/70 p-3 font-mono text-xs text-slate-100">
                  {runOutput}
                </pre>
              </div>

              {runResult?.status === "running" && runResult.progress ? (
                <div className="rounded-xl border border-slate-400/20 bg-slate-950/50 p-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-200">Progress</h3>
                  <p className="mb-2 text-sm text-slate-300">
                    Running test {runResult.progress.current} of {runResult.progress.total}...
                  </p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-sky-400 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, (runResult.progress.current / Math.max(runResult.progress.total, 1)) * 100),
                        )}%`,
                      }}
                    />
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-400/20 bg-slate-950/70 p-3 font-mono text-xs text-slate-100">
                    {runResult.progress.output || "(no output yet)"}
                  </pre>
                </div>
              ) : null}

              {runResult?.result?.status === "Wrong Answer" ? (
                <div className="rounded-xl border border-rose-400/30 bg-rose-950/20 p-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-rose-200">Wrong Answer</h3>
                  <p className="mb-2 text-sm text-rose-100">
                    Failed test case: {runResult.result.failedTestCase ?? "Unknown"}
                  </p>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-slate-300">Expected</p>
                      <pre className="whitespace-pre-wrap rounded-lg border border-slate-400/20 bg-slate-950/80 p-3 font-mono text-xs text-slate-100">
                        {runResult.result.expected || "(empty)"}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-slate-300">Got</p>
                      <pre className="whitespace-pre-wrap rounded-lg border border-slate-400/20 bg-slate-950/80 p-3 font-mono text-xs text-slate-100">
                        {runResult.result.got || "(empty)"}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : null}

              {runResult?.result?.status === "Compilation Error" || runResult?.result?.status === "Runtime Error" ? (
                <div className="rounded-xl border border-rose-400/30 bg-rose-950/20 p-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-rose-200">
                    {runResult.result.status}
                  </h3>
                  <pre className="whitespace-pre-wrap rounded-lg border border-rose-400/25 bg-slate-950/80 p-3 font-mono text-xs text-rose-100">
                    {runResult.result.error || "(no error output)"}
                  </pre>
                </div>
              ) : null}

              {runResult?.result?.status === "Time Limit Exceeded" ? (
                <div className="rounded-xl border border-amber-400/30 bg-amber-950/20 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-200">Time Limit Exceeded</h3>
                </div>
              ) : null}

            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-[18px] border border-slate-400/20 bg-[linear-gradient(170deg,rgba(15,23,42,0.88),rgba(15,23,42,0.62))] shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
          <div className="flex items-start justify-between gap-3 border-b border-slate-400/20 px-5 py-4">
            <div>
              <h2 className="text-xl font-semibold">Code Editor</h2>
              <p className="text-sm text-slate-400">Drag the bar below the editor to resize height.</p>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="language" className="text-xs uppercase tracking-wide text-slate-400">Language</label>
              <select
                id="language"
                value={language}
                onChange={(event) => setLanguage(event.target.value as "python" | "c" | "java")}
                className="rounded-xl border border-slate-400/30 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
              >
                {(problem?.languages || []).map((option) => (
                  <option key={option} value={option}>
                    {option.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden border-y border-slate-400/20" style={{ height: `${editorHeight}px` }}>
            <MonacoCodeEditor
              language={language}
              value={code}
              onChange={setCode}
              onKeystroke={(timestamp) => tracking.recordKeystroke(timestamp)}
              onPasteAttempt={() => tracking.recordPasteAttempt()}
              onContentChange={(length) => tracking.recordContentChange(length)}
            />
          </div>

          <div
            className="h-2 cursor-ns-resize border-y border-sky-300/25 bg-gradient-to-r from-sky-300/15 via-emerald-300/20 to-sky-300/15"
            onMouseDown={startResize}
            role="separator"
            aria-label="Resize editor"
          />

          <div className="flex justify-end gap-3 px-5 py-3">
            <Button onClick={handleRun} disabled={running || submitting}>
              <span className="inline-flex items-center gap-2">
                {running ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-200 border-t-transparent" /> : null}
                {running ? "Running..." : "Run"}
              </span>
            </Button>
            <Button variant="secondary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>

        </section>
      </div>
    </AppShell>
  );
}
