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
import { ExecutionVisualizer } from "@/components/visualization/ExecutionVisualizer";
import { useBehaviorTracking } from "@/hooks/useBehaviorTracking";

type LeftTab = "problem" | "flowchart" | "submissions";
type EditorTab = "testcases" | "output" | "visualization" | "console";
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
  const [editorTab, setEditorTab] = useState<EditorTab>("testcases");
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
    `rounded-lg border px-3 py-1.5 text-sm transition ${
      active
        ? "border-[color:var(--primary)]/60 bg-[color:var(--primary)]/20 text-[color:var(--text-primary)]"
        : "border-[color:var(--border)] bg-white/80 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
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
    <AppShell hideFooter hideSidebar>
      <div className="space-y-4">
        <header className="rounded-xl border border-[color:var(--border)] bg-[linear-gradient(135deg,#fff8eb,#fff2f0_45%,#fff9f2)] p-4 shadow-[0_12px_28px_rgba(105,83,55,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Problem Workspace</p>
              <h1 className="mt-1 text-2xl font-semibold">{problem?.title ?? "Loading problem"}</h1>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                {classroomId ? `Classroom: ${classroomId}` : "Open inside classroom context to enable graded submission."}
              </p>
              {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {problem ? (
                <Badge tone={problem.difficulty === "easy" ? "success" : problem.difficulty === "medium" ? "warning" : "danger"}>
                  {problem.difficulty}
                </Badge>
              ) : null}
              <Badge tone="neutral">{language.toUpperCase()}</Badge>
              <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-white/80 shadow-[0_10px_24px_rgba(105,83,55,0.04)]">
            <div className="flex flex-wrap gap-2 border-b border-[color:var(--border)] p-3">
              <button type="button" className={tabClass(leftTab === "problem")} onClick={() => setLeftTab("problem")}>Problem</button>
              <button type="button" className={tabClass(leftTab === "flowchart")} onClick={() => setLeftTab("flowchart")}>Flowchart</button>
              <button type="button" className={tabClass(leftTab === "submissions")} onClick={() => setLeftTab("submissions")}>Submissions</button>
            </div>

            {leftTab === "problem" ? (
              <div className="app-scrollbar max-h-[calc(100vh-300px)] space-y-4 overflow-auto p-4">
                <article
                  className="rounded-lg border border-[color:var(--border)] bg-white/80 p-4 text-sm
                  [&_h1]:mb-2 [&_h1]:text-xl [&_h2]:mb-2 [&_h2]:text-lg [&_h3]:mb-2 [&_h3]:text-base
                  [&_p]:mb-2 [&_pre]:mb-2 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-[#fff7eb] [&_pre]:p-3
                  [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_code]:font-mono"
                  dangerouslySetInnerHTML={{ __html: renderedDescription }}
                />
                <div className="rounded-lg border border-[color:var(--border)] bg-white/80 p-4">
                  <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">Constraints</h3>
                  <p className="text-sm text-[color:var(--text-secondary)]">{problem?.constraints || "No constraints provided."}</p>
                </div>
              </div>
            ) : leftTab === "flowchart" ? (
              <div className="h-[calc(100vh-300px)] p-4">
                <FlowchartPanel data={problem?.flowchart ?? null} />
              </div>
            ) : (
              <div className="app-scrollbar max-h-[calc(100vh-300px)] space-y-4 overflow-auto p-4">
                <div className="rounded-lg border border-[color:var(--border)] bg-white/80 p-4">
                  <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">Submission</h3>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-[color:var(--text-secondary)]">{submissionOutput}</pre>
                </div>
                <div className="rounded-lg border border-[color:var(--border)] bg-white/80 p-4">
                  <h3 className="mb-2 text-xs uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">Run Result</h3>
                  <pre className="whitespace-pre-wrap font-mono text-xs text-[color:var(--text-secondary)]">{runOutput}</pre>
                </div>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-white/80 shadow-[0_10px_24px_rgba(105,83,55,0.04)]">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--border)] p-3">
              <div>
                <h2 className="text-lg font-semibold">Code Editor</h2>
                <p className="text-xs text-[color:var(--text-secondary)]">VS Code style workspace with run and submit actions.</p>
              </div>
              <label className="grid gap-1 text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">
                Language
                <select
                  id="language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as "python" | "c" | "java")}
                  className="h-9 rounded-lg border border-[color:var(--border)] bg-white px-3 text-sm text-[color:var(--text-primary)] outline-none"
                >
                  {(problem?.languages || []).map((option) => (
                    <option key={option} value={option}>
                      {option.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="overflow-hidden border-y border-[color:var(--border)]" style={{ height: `${editorHeight}px` }}>
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
              className="h-2 cursor-ns-resize border-y border-[color:var(--primary)]/40 bg-gradient-to-r from-[color:var(--primary)]/10 via-[color:var(--success)]/10 to-[color:var(--primary)]/10"
              onMouseDown={startResize}
              role="separator"
              aria-label="Resize editor"
            />

            <div className="flex flex-wrap justify-end gap-2 border-b border-[color:var(--border)] p-3">
              <Button onClick={handleRun} disabled={running || submitting}>
                {running ? "Running..." : "Run"}
              </Button>
              <Button variant="secondary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>

            <div className="p-3">
              <div className="mb-3 flex flex-wrap gap-2">
                <button type="button" className={tabClass(editorTab === "testcases")} onClick={() => setEditorTab("testcases")}>Testcases</button>
                <button type="button" className={tabClass(editorTab === "output")} onClick={() => setEditorTab("output")}>Output</button>
                <button type="button" className={tabClass(editorTab === "visualization")} onClick={() => setEditorTab("visualization")}>Visualization</button>
                <button type="button" className={tabClass(editorTab === "console")} onClick={() => setEditorTab("console")}>Console</button>
              </div>

              {editorTab === "testcases" ? (
                <div className="app-scrollbar max-h-60 space-y-2 overflow-auto">
                  {visibleTestcases.map((test) => (
                    <div key={test.id} className="rounded-lg border border-[color:var(--border)] bg-white/80 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">{test.id}</p>
                        {runResult?.status === "completed" ? (
                          <Badge tone={testcaseChecksById.get(test.id)?.passed ? "success" : "danger"}>
                            {testcaseChecksById.get(test.id)?.passed ? "Pass" : "Fail"}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-[color:var(--text-secondary)]">Input: {test.input || "(empty)"}</p>
                      <p className="mt-1 text-xs text-[color:var(--text-secondary)]">Expected: {test.expectedOutput || "(empty)"}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {editorTab === "output" ? (
                <pre className="app-scrollbar max-h-60 overflow-auto rounded-lg border border-[color:var(--border)] bg-white/80 p-3 font-mono text-xs text-[color:var(--text-secondary)]">
                  {runOutput}
                </pre>
              ) : null}

              {editorTab === "visualization" ? (
                <div className="rounded-lg border border-[color:var(--border)] bg-white/80 p-3">
                  <ExecutionVisualizer
                    language={language}
                    code={code}
                    testcases={problem?.testcases ?? []}
                  />
                </div>
              ) : null}

              {editorTab === "console" ? (
                <pre className="app-scrollbar max-h-60 overflow-auto rounded-lg border border-[color:var(--border)] bg-white/80 p-3 font-mono text-xs text-[color:var(--text-secondary)]">
                  {runResult?.progress?.output || runResult?.result?.error || "Console logs will appear here after run."}
                </pre>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
