"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { ProblemSolveData, RunResult, SubmitResult } from "@/lib/types";
import { AppShell } from "@/components/layout/AppShell";
import {
  FilledButton,
  RoundedButton,
  TextButton,
} from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MonacoCodeEditor } from "@/components/editor/MonacoCodeEditor";
import { ExecutionVisualizer } from "@/components/visualization/ExecutionVisualizer";
import { useBehaviorTracking } from "@/hooks/useBehaviorTracking";

type LeftTab = "description" | "submissions";
type BottomTab = "testcases" | "results" | "visualization";
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

type TestcaseCheck = {
  id: string;
  expectedOutput: string;
  actualOutput: string;
  status: "idle" | "pass" | "fail";
};

const leftTabClass = (active: boolean) =>
  [
    "rounded-full px-3 py-1.5 text-sm transition",
    active
      ? "bg-[color:var(--primary)] text-[color:var(--text-primary)]"
      : "text-[#c7d6ca] hover:bg-white/5 hover:text-white",
  ].join(" ");

const bottomTabClass = (active: boolean) =>
  [
    "inline-flex items-center rounded-t-2xl border border-b-0 px-4 py-2 text-sm transition",
    active
      ? "border-white/10 bg-[#232323] text-white"
      : "border-transparent bg-transparent text-[#95a39a] hover:text-white",
  ].join(" ");

function testcaseLabel(id: string, index: number) {
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : `Testcase ${index + 1}`;
}

export default function ProblemSolvePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tracking = useBehaviorTracking();

  const [problem, setProblem] = useState<ProblemSolveData | null>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("description");
  const [bottomTab, setBottomTab] = useState<BottomTab>("testcases");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<"python" | "c" | "java">("python");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [executionState, setExecutionState] =
    useState<ExecutionUiState>("idle");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorHeight, setEditorHeight] = useState(540);

  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(540);
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
        const data = await api.getProblemSolveData(id, {
          classroomId,
          language,
        });
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
    resizeStartYRef.current = event.clientY;
    resizeStartHeightRef.current = editorHeight;

    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - resizeStartYRef.current;
      const nextHeight = Math.min(
        Math.max(resizeStartHeightRef.current + deltaY, 360),
        Math.floor(window.innerHeight * 0.82),
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
    () =>
      (problem?.testcases ?? []).filter(
        (test) => test.visibility === "visible",
      ),
    [problem],
  );

  const renderedDescription = useMemo(
    () => markdownToHtml(problem?.descriptionMarkdown || ""),
    [problem],
  );

  const submissionOutput = useMemo(() => {
    if (!submitResult) return "No submission created yet.";
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
      let status: TestcaseCheck["status"] = "idle";
      let actualOutput = "";

      if (runResult?.status === "completed") {
        if (result?.status === "Accepted") {
          status = "pass";
          actualOutput = result.got ?? "";
        } else if (
          result?.status === "Wrong Answer" &&
          typeof result.failedTestCase === "number"
        ) {
          if (index + 1 < result.failedTestCase) {
            status = "pass";
          } else if (index + 1 === result.failedTestCase) {
            status = "fail";
            actualOutput = result.got ?? "";
          }
        }
      }

      return {
        id: test.id,
        expectedOutput: test.expectedOutput,
        actualOutput,
        status,
      };
    });

    return new Map(checks.map((check) => [check.id, check]));
  }, [runResult, visibleTestcases]);

  const runOutput = useMemo(() => {
    if (executionState === "timeout")
      return "Execution timed out after 60 seconds.";
    if (!runResult) return "Run code to populate testcase results.";
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
      runResult.result.expected
        ? `Expected: ${runResult.result.expected}`
        : null,
      runResult.result.got ? `Got: ${runResult.result.got}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }, [executionState, runResult]);

  const statusBadge = useMemo(() => {
    if (executionState === "queued")
      return { label: "Queued", tone: "warning" as const };
    if (executionState === "running")
      return { label: "Running", tone: "warning" as const };
    if (executionState === "timeout")
      return { label: "Timed Out", tone: "danger" as const };
    if (runResult?.result?.status === "Accepted")
      return { label: "Accepted", tone: "success" as const };
    if (runResult?.status === "completed" || runResult?.status === "failed") {
      return {
        label: runResult.result?.status ?? "Error",
        tone: "danger" as const,
      };
    }
    return { label: "Idle", tone: "neutral" as const };
  }, [executionState, runResult]);

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
      setLeftTab("submissions");
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

    setRunResult(null);
    setExecutionState("queued");
    setRunning(true);
    setError(null);
    setBottomTab("results");
    tracking.recordRun();

    try {
      const result = await api.runCodeWithPolling(
        language,
        code,
        problem.testcases,
        {
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
            if (update.status === "completed" || update.status === "failed")
              setExecutionState("completed");
          },
        },
      );

      setRunResult(result);
      const total = result.result?.total ?? problem.testcases.length;
      const passed = result.result?.passed ?? 0;
      const failureCount = Math.max(total - passed, 0);
      if (failureCount > 0) {
        tracking.recordTestFailure(failureCount);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to run code";
      if (message.includes("timed out")) {
        setExecutionState("timeout");
      }
      setError(message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <AppShell hideFooter fullBleed>
      <div className="grid min-h-[calc(100vh-60px)] grid-cols-1 bg-[#111111] text-white xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex min-h-[calc(100vh-60px)] flex-col border-r border-white/8 bg-[#1a1a1a]">
          <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
            <button
              type="button"
              className={leftTabClass(leftTab === "description")}
              onClick={() => setLeftTab("description")}
            >
              Description
            </button>
            <button
              type="button"
              className={leftTabClass(leftTab === "submissions")}
              onClick={() => setLeftTab("submissions")}
            >
              Submissions
            </button>
          </div>

          {leftTab === "description" ? (
            <div className="app-scrollbar flex-1 overflow-auto px-5 py-5">
              <div className="mx-auto max-w-4xl space-y-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
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
                  <h1 className="text-3xl font-semibold text-white">
                    {problem?.title ?? "Loading problem"}
                  </h1>
                  {classroomId ? (
                    <p className="text-sm text-[#a8b7ad]">
                      Classroom context active.
                    </p>
                  ) : null}
                  {error ? (
                    <p className="text-sm text-[#f87171]">{error}</p>
                  ) : null}
                </div>

                <article
                  className="rounded-[28px] border border-white/8 bg-[#202020] p-6 text-[15px] leading-7 text-[#e8efe9]
                  [&_h1]:mb-3 [&_h1]:text-2xl [&_h2]:mb-3 [&_h2]:text-xl [&_h3]:mb-2 [&_h3]:text-lg
                  [&_p]:mb-4 [&_pre]:mb-4 [&_pre]:overflow-auto [&_pre]:rounded-2xl [&_pre]:bg-[#171717] [&_pre]:p-4
                  [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_code]:font-mono [&_code]:text-[#8de0a8]"
                  dangerouslySetInnerHTML={{ __html: renderedDescription }}
                />

                <div className="rounded-[24px] border border-white/8 bg-[#202020] p-5">
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#8ca097]">
                    Constraints
                  </p>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-[#d8e2db]">
                    {problem?.constraints || "No constraints provided."}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="app-scrollbar flex-1 overflow-auto px-5 py-5">
              <div className="mx-auto max-w-4xl space-y-4">
                <div className="rounded-[24px] border border-white/8 bg-[#202020] p-5">
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#8ca097]">
                    Submission
                  </p>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-[#d8e2db]">
                    {submissionOutput}
                  </pre>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-[#202020] p-5">
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#8ca097]">
                    Execution
                  </p>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-[#d8e2db]">
                    {runOutput}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="flex min-h-[calc(100vh-60px)] flex-col bg-[#111111]">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div className="space-y-1">
              <p className="text-lg font-semibold text-white">Code</p>
              <p className="text-xs text-[#8ca097]">
                Write, run, and submit from the same workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <label className="grid gap-1 text-[9px] uppercase tracking-[0.14em] text-[#8ca097]">
                Language
                <select
                  id="language"
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value as "python" | "c" | "java")
                  }
                  className="h-8 rounded-xl border border-white/10 bg-[#1d1d1d] px-3 text-xs text-white outline-none"
                >
                  {(problem?.languages || []).map((option) => (
                    <option key={option} value={option}>
                      {option.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <FilledButton
                onClick={handleRun}
                disabled={running || submitting}
                size="sm"
                className="border-white/10 bg-[#191919] text-white hover:border-[#22c55e] hover:text-[#22c55e]"
              >
                {running ? "Running..." : "Run"}
              </FilledButton>
              <RoundedButton
                onClick={handleSubmit}
                disabled={submitting}
                size="sm"
                className="text-[#0f1b12]"
              >
                {submitting ? "Submitting..." : "Submit"}
              </RoundedButton>
            </div>
          </div>

          <div
            className="border-b border-white/8"
            style={{ height: `${editorHeight}px` }}
          >
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
            className="h-2 cursor-ns-resize bg-[#171717]"
            onMouseDown={startResize}
            role="separator"
            aria-label="Resize editor"
          />

          <div className="flex min-h-0 flex-1 flex-col justify-end bg-[#121212]">
            <div className="app-scrollbar min-h-[220px] flex-1 overflow-auto border-t border-white/8 bg-[#1a1a1a] px-4 py-4">
              {bottomTab === "testcases" ? (
                <div className="space-y-3">
                  {visibleTestcases.map((test, index) => {
                    const result = testcaseChecksById.get(test.id);
                    return (
                      <div
                        key={test.id}
                        className="rounded-2xl border border-white/8 bg-[#222222] p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white">
                            {testcaseLabel(test.id, index)}
                          </p>
                          {result?.status === "pass" ? (
                            <Badge tone="success">Pass</Badge>
                          ) : null}
                          {result?.status === "fail" ? (
                            <Badge tone="danger">Fail</Badge>
                          ) : null}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[#8ca097]">
                              Input
                            </p>
                            <pre className="whitespace-pre-wrap rounded-xl bg-[#171717] p-3 font-mono text-xs text-[#dbe7dd]">
                              {test.input || "(empty)"}
                            </pre>
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[#8ca097]">
                              Expected Output
                            </p>
                            <pre className="whitespace-pre-wrap rounded-xl bg-[#171717] p-3 font-mono text-xs text-[#dbe7dd]">
                              {test.expectedOutput || "(empty)"}
                            </pre>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {bottomTab === "results" ? (
                <div className="space-y-3">
                  {visibleTestcases.map((test, index) => {
                    const result = testcaseChecksById.get(test.id);
                    return (
                      <div
                        key={`${test.id}-result`}
                        className="rounded-2xl border border-white/8 bg-[#222222] p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white">
                            {testcaseLabel(test.id, index)}
                          </p>
                          {result?.status === "pass" ? (
                            <Badge tone="success">Pass</Badge>
                          ) : null}
                          {result?.status === "fail" ? (
                            <Badge tone="danger">Fail</Badge>
                          ) : null}
                          {result?.status === "idle" ? (
                            <Badge tone="neutral">Pending</Badge>
                          ) : null}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[#8ca097]">
                              Expected
                            </p>
                            <pre className="whitespace-pre-wrap rounded-xl bg-[#171717] p-3 font-mono text-xs text-[#dbe7dd]">
                              {result?.expectedOutput ||
                                test.expectedOutput ||
                                "(empty)"}
                            </pre>
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[#8ca097]">
                              Actual
                            </p>
                            <pre className="whitespace-pre-wrap rounded-xl bg-[#171717] p-3 font-mono text-xs text-[#dbe7dd]">
                              {result?.status === "idle"
                                ? "Run code to view testcase output."
                                : result?.actualOutput || "(empty)"}
                            </pre>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {bottomTab === "visualization" ? (
                <div className="rounded-2xl border border-white/8 bg-[#222222] p-4">
                  <ExecutionVisualizer
                    language={language}
                    code={code}
                    testcases={problem?.testcases ?? []}
                  />
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap sticky bottom-0 items-center gap-2 border-t border-white/8 bg-[#151515] px-4 pt-3">
              <button
                type="button"
                className={bottomTabClass(bottomTab === "testcases")}
                onClick={() => setBottomTab("testcases")}
              >
                Testcases
              </button>
              <button
                type="button"
                className={bottomTabClass(bottomTab === "results")}
                onClick={() => setBottomTab("results")}
              >
                Test Results
              </button>
              <button
                type="button"
                className={bottomTabClass(bottomTab === "visualization")}
                onClick={() => setBottomTab("visualization")}
              >
                Visualization
              </button>
              <div className="ml-auto pb-2">
                <TextButton
                  size="sm"
                  className="text-[#8ca097] hover:bg-white/5 hover:text-white"
                >
                  {statusBadge.label}
                </TextButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
