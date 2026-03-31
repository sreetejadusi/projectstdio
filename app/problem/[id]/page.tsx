"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { createSubmission } from "@/lib/activity/api";
import { fetchApi } from "@/lib/utils/http";
import type { ProblemSolveData, RunResult } from "@/lib/types";
import { AppShell } from "@/components/layout/AppShell";
import {
  FilledButton,
  RoundedButton,
  TextButton,
} from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MonacoCodeEditor } from "@/components/editor/MonacoCodeEditor";
import { FlowchartPanel } from "@/components/flow/FlowchartPanel";
import { ExecutionVisualizer } from "@/components/visualization/ExecutionVisualizer";
import { useActivityTracker } from "@/hooks/useActivityTracker";

type LeftTab = "problem" | "flowchart" | "submissions";
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

type SubmissionRecord = {
  submissionId: string;
  language: "python" | "c" | "java";
  passed: number;
  total: number;
  response: Record<string, unknown> | null;
};

type SessionData = {
  userId: string;
  role: "student" | "instructor" | "admin";
  organizationId?: string;
};

type ProblemSubmissionSummary = {
  id: string;
  problemId: string;
  classroomId: string;
  language: "python" | "c" | "java";
  submittedAt: string;
  submissionPath: string;
  acceptance: number | null;
};

type ProblemSubmissionDetail = ProblemSubmissionSummary & {
  code: string;
  metadata: Record<string, unknown> | null;
};

type DraftWorkspaceState = {
  code: string;
  language: "python" | "c" | "java";
  runResult: RunResult | null;
  executionState: ExecutionUiState;
};

const bottomTabClass = (active: boolean) =>
  [
    "inline-flex items-center rounded-t-2xl border border-b-0 px-4 py-2 text-sm transition",
    active
      ? "border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--text-primary)] dark:bg-[#232323] dark:text-white"
      : "border-transparent bg-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] dark:hover:text-white",
  ].join(" ");

function testcaseLabel(id: string, index: number) {
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : `Testcase ${index + 1}`;
}

export default function ProblemSolvePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const problemId = (params?.id as string) || "";

  const [problem, setProblem] = useState<ProblemSolveData | null>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("problem");
  const [bottomTab, setBottomTab] = useState<BottomTab>("testcases");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<"python" | "c" | "java">("python");
  const [userId, setUserId] = useState("");
  const [submissionRecord, setSubmissionRecord] =
    useState<SubmissionRecord | null>(null);
  const [submissions, setSubmissions] = useState<ProblemSubmissionSummary[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<ProblemSubmissionDetail | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionActionLoading, setSubmissionActionLoading] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [executionState, setExecutionState] =
    useState<ExecutionUiState>("idle");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorHeight, setEditorHeight] = useState(540);
  const [editorFontSize, setEditorFontSize] = useState(13);

  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(540);
  const draftWorkspaceRef = useRef<DraftWorkspaceState | null>(null);
  const classroomId = searchParams.get("classroomId") ?? undefined;
  const activity = useActivityTracker({ userId, problemId });
  const isViewingSubmission = selectedSubmission !== null;

  const decreaseEditorFontSize = () => {
    setEditorFontSize((current) => Math.max(11, current - 1));
  };

  const increaseEditorFontSize = () => {
    setEditorFontSize((current) => Math.min(22, current + 1));
  };

  const loadSubmissions = useCallback(async () => {
    if (!problemId) {
      return;
    }

    setSubmissionsLoading(true);

    try {
      const result = await fetchApi<{ submissions: ProblemSubmissionSummary[] }>(
        `/api/submissions?problemId=${encodeURIComponent(problemId)}`,
      );
      setSubmissions(result.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setSubmissionsLoading(false);
    }
  }, [problemId]);

  const loadSubmissionDetail = async (submissionId: string) => {
    setSubmissionActionLoading(true);

    try {
      const result = await fetchApi<{ submission: ProblemSubmissionDetail }>(
        `/api/submissions/${submissionId}`,
      );
      if (!draftWorkspaceRef.current) {
        draftWorkspaceRef.current = {
          code,
          language,
          runResult,
          executionState,
        };
      }
      setSelectedSubmission(result.submission);
      setCode(result.submission.code);
      setLanguage(result.submission.language);
      setRunResult(null);
      setExecutionState("completed");
      setBottomTab("results");
      setLeftTab("submissions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submission");
    } finally {
      setSubmissionActionLoading(false);
    }
  };

  const restoreDraftWorkspace = () => {
    if (!draftWorkspaceRef.current) {
      setSelectedSubmission(null);
      return;
    }

    setCode(draftWorkspaceRef.current.code);
    setLanguage(draftWorkspaceRef.current.language);
    setRunResult(draftWorkspaceRef.current.runResult);
    setExecutionState(draftWorkspaceRef.current.executionState);
    setSelectedSubmission(null);
    draftWorkspaceRef.current = null;
  };

  const deleteSubmission = async (submissionId: string) => {
    setSubmissionActionLoading(true);

    try {
      await fetchApi<{ deleted: true; submissionId: string }>(`/api/submissions/${submissionId}`, {
        method: "DELETE",
      });
      setSubmissions((current) => current.filter((submission) => submission.id !== submissionId));
      if (selectedSubmission?.id === submissionId) {
        restoreDraftWorkspace();
      } else {
        setSelectedSubmission((current) =>
          current?.id === submissionId ? null : current,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete submission");
    } finally {
      setSubmissionActionLoading(false);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await fetchApi<SessionData>("/api/auth/session");
        setUserId(session.userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
      }
    };

    void loadSession();
  }, []);

  useEffect(() => {
    if (!userId || !problemId) {
      return;
    }

    void loadSubmissions();
  }, [loadSubmissions, problemId, userId]);

  useEffect(() => {
    if (!problemId) return;

    const load = async () => {
      setError(null);
      try {
        const data = await api.getProblemSolveData(problemId, { classroomId });
        setProblem(data);
        setLanguage(data.selectedLanguage);
        setCode(data.baseCode || "");
        setRunResult(null);
        setSubmissionRecord(null);
        setSelectedSubmission(null);
        draftWorkspaceRef.current = null;
        setExecutionState("idle");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load problem");
      }
    };

    void load();
  }, [classroomId, problemId]);

  useEffect(() => {
    if (!problemId || !problem) return;

    const loadLanguage = async () => {
      try {
        const data = await api.getProblemSolveData(problemId, {
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
  }, [classroomId, language, problem, problemId]);

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

  const viewedSubmissionResult = useMemo<RunResult | null>(() => {
    if (!selectedSubmission) {
      return null;
    }

    const metadata = selectedSubmission.metadata ?? {};
    const testcaseResults = Array.isArray(metadata.testcase_results)
      ? metadata.testcase_results
      : Array.isArray(metadata.results)
        ? metadata.results
        : [];
    const passed = testcaseResults.filter(
      (test) => typeof test === "object" && test !== null && (test as { passed?: boolean }).passed,
    ).length;
    const total = testcaseResults.length || visibleTestcases.length;

    return {
      status: "completed",
      language: selectedSubmission.language,
      result: {
        status:
          typeof metadata.status === "string"
            ? (metadata.status as
                | "Accepted"
                | "Wrong Answer"
                | "Compilation Error"
                | "Runtime Error"
                | "Time Limit Exceeded")
            : selectedSubmission.acceptance === 1
              ? "Accepted"
              : "Wrong Answer",
        passed,
        total,
      },
      tests: [],
    };
  }, [selectedSubmission, visibleTestcases.length]);

  const activeRunResult = isViewingSubmission ? viewedSubmissionResult : runResult;

  const submissionOutput = useMemo(() => {
    if (!submissionRecord) return "No submission created yet.";
    return [
      `Submission ID: ${submissionRecord.submissionId}`,
      `Language: ${submissionRecord.language}`,
      `Passed: ${submissionRecord.passed}/${submissionRecord.total}`,
      submissionRecord.response
        ? `Response: ${JSON.stringify(submissionRecord.response, null, 2)}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
  }, [submissionRecord]);

  const testcaseChecksById = useMemo(() => {
    const checks = visibleTestcases.map((test, index) => {
      const result = activeRunResult?.result;
      let status: TestcaseCheck["status"] = "idle";
      let actualOutput = "";

      if (isViewingSubmission && selectedSubmission?.metadata) {
        const testcaseResults = Array.isArray(selectedSubmission.metadata.testcase_results)
          ? selectedSubmission.metadata.testcase_results
          : Array.isArray(selectedSubmission.metadata.results)
            ? selectedSubmission.metadata.results
            : [];
        const submissionTest = testcaseResults[index] as
          | { passed?: boolean; actualOutput?: string; output?: string }
          | undefined;

        if (submissionTest) {
          status = submissionTest.passed ? "pass" : "fail";
          actualOutput = submissionTest.actualOutput ?? submissionTest.output ?? "";
        } else if (selectedSubmission.acceptance === 1) {
          status = "pass";
        }
      }

      if (!isViewingSubmission && runResult?.status === "completed") {
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
  }, [activeRunResult, isViewingSubmission, runResult, selectedSubmission, visibleTestcases]);

  const statusBadge = useMemo(() => {
    if (isViewingSubmission && selectedSubmission) {
      return {
        label: selectedSubmission.acceptance === 1 ? "Accepted" : "Submission",
        tone: selectedSubmission.acceptance === 1 ? ("success" as const) : ("neutral" as const),
      };
    }
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
  }, [executionState, isViewingSubmission, runResult, selectedSubmission]);

  const handleSubmit = async () => {
    if (!problem || !problemId) {
      setError("Problem is not loaded.");
      return;
    }

    if (isViewingSubmission) {
      setError("Return to your current draft before creating a new submission.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await activity.flush();

      const total = runResult?.result?.total ?? problem.testcases.length;
      const passed = runResult?.result?.passed ?? 0;
      const submissionId = activity.getSubmissionId();
      const response = await createSubmission({
        user_id: userId,
        problem_id: problemId,
        code,
        language,
        passed,
        total,
      });

      setSubmissionRecord({
        submissionId,
        language,
        passed,
        total,
        response,
      });
      activity.clearQueue();
      activity.resetSubmissionSession();
      await loadSubmissions();
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
      activity.recordRun(passed, total);
    } catch (err) {
      activity.recordRun(0, problem.testcases.length);
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
      <div className="grid min-h-[calc(100vh-60px)] grid-cols-1 bg-[color:var(--surface)] text-[color:var(--text-primary)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] dark:bg-[#111111] dark:text-white">
        <section className="flex min-h-[calc(100vh-60px)] flex-col border-r border-[color:var(--border)] bg-[color:var(--surface)] dark:border-white/8 dark:bg-[#1a1a1a]">
          <div className="app-scrollbar flex-1 overflow-auto px-5 py-5">
            {leftTab === "problem" ? (
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
                  <h1 className="text-3xl font-semibold text-[color:var(--text-primary)] dark:text-white">
                    {problem?.title ?? "Loading problem"}
                  </h1>
                  {classroomId ? (
                    <p className="text-sm text-[color:var(--text-secondary)] dark:text-[#a8b7ad]">
                      Classroom context active.
                    </p>
                  ) : null}
                  {error ? (
                    <p className="text-sm text-[#f87171]">{error}</p>
                  ) : null}
                </div>

                <article
                  className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 text-[15px] leading-7 text-[color:var(--text-primary)]
                  [&_h1]:mb-3 [&_h1]:text-2xl [&_h2]:mb-3 [&_h2]:text-xl [&_h3]:mb-2 [&_h3]:text-lg
                  [&_p]:mb-4 [&_pre]:mb-4 [&_pre]:overflow-auto [&_pre]:rounded-2xl [&_pre]:bg-[color:var(--surface)] [&_pre]:p-4
                  [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_code]:font-mono [&_code]:text-[color:var(--primary)]
                  dark:border-white/8 dark:bg-[#202020] dark:text-[#e8efe9] dark:[&_pre]:bg-[#171717] dark:[&_code]:text-[#8de0a8]"
                  dangerouslySetInnerHTML={{ __html: renderedDescription }}
                />

                <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 dark:border-white/8 dark:bg-[#202020]">
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-secondary)] dark:text-[#8ca097]">
                    Constraints
                  </p>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-[color:var(--text-primary)] dark:text-[#d8e2db]">
                    {problem?.constraints || "No constraints provided."}
                  </pre>
                </div>

                <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 dark:border-white/8 dark:bg-[#202020]">
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-secondary)] dark:text-[#8ca097]">
                    Latest Submission
                  </p>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-[color:var(--text-primary)] dark:text-[#d8e2db]">
                    {submissionOutput}
                  </pre>
                </div>
              </div>
            ) : leftTab === "flowchart" ? (
              <div className="flex h-full min-h-[calc(100vh-180px)] flex-col">
                <FlowchartPanel data={problem?.flowchart ?? null} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                      Submissions
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-[color:var(--text-primary)] dark:text-white">
                      Your runs for this problem
                    </h2>
                  </div>
                  {selectedSubmission ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">{selectedSubmission.language.toUpperCase()}</Badge>
                      <Badge tone="success">Read only</Badge>
                      {selectedSubmission.acceptance !== null ? (
                        <Badge tone={selectedSubmission.acceptance === 1 ? "success" : "warning"}>
                          Acceptance {Math.round(selectedSubmission.acceptance * 100)}%
                        </Badge>
                      ) : null}
                      <TextButton onClick={restoreDraftWorkspace} size="sm">
                        Back to current draft
                      </TextButton>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {submissionsLoading ? (
                    <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-6 text-sm text-[color:var(--text-secondary)]">
                      Loading submissions...
                    </div>
                  ) : submissions.length > 0 ? (
                    submissions.map((submission) => {
                      const isSelected = selectedSubmission?.id === submission.id;

                      return (
                        <div
                          key={submission.id}
                          className={[
                            "rounded-[24px] border bg-[color:var(--card)] p-4 transition",
                            isSelected
                              ? "border-[color:var(--primary)] ring-1 ring-[color:var(--primary)]/25"
                              : "border-[color:var(--border)]",
                          ].join(" ")}
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-[color:var(--text-primary)] dark:text-white">
                                {new Intl.DateTimeFormat("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).format(new Date(submission.submittedAt))}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">
                                  {submission.language.toUpperCase()}
                                </p>
                                {submission.acceptance !== null ? (
                                  <Badge tone={submission.acceptance === 1 ? "success" : "warning"}>
                                    {Math.round(submission.acceptance * 100)}%
                                  </Badge>
                                ) : null}
                                {isSelected ? <Badge tone="neutral">Viewing</Badge> : null}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <RoundedButton
                                onClick={() => void loadSubmissionDetail(submission.id)}
                                disabled={submissionActionLoading}
                                size="sm"
                              >
                                View
                              </RoundedButton>
                              <TextButton
                                onClick={() => void deleteSubmission(submission.id)}
                                disabled={submissionActionLoading}
                                size="sm"
                                className="text-[color:var(--error)] hover:bg-[color:var(--error)]/10"
                              >
                                Delete
                              </TextButton>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-6 text-sm text-[color:var(--text-secondary)]">
                      No submissions for this problem yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-[color:var(--border)] bg-[color:var(--surface)] px-4 pt-3 dark:border-white/8 dark:bg-[#151515]">
            <button
              type="button"
              className={bottomTabClass(leftTab === "problem")}
              onClick={() => setLeftTab("problem")}
            >
              Problem
            </button>
            <button
              type="button"
              className={bottomTabClass(leftTab === "flowchart")}
              onClick={() => setLeftTab("flowchart")}
            >
              Flowchart
            </button>
            <button
              type="button"
              className={bottomTabClass(leftTab === "submissions")}
              onClick={() => setLeftTab("submissions")}
            >
              Submissions
            </button>
            <div className="ml-auto pb-2">
              <TextButton
                size="sm"
                className="text-[color:var(--text-secondary)] hover:bg-black/5 hover:text-[color:var(--text-primary)] dark:text-[#8ca097] dark:hover:bg-white/5 dark:hover:text-white"
              >
                {leftTab === "flowchart" ? "Graph View" : statusBadge.label}
              </TextButton>
            </div>
          </div>
        </section>

        <section className="flex min-h-[calc(100vh-60px)] flex-col bg-[color:var(--surface)] dark:bg-[#111111]">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 dark:border-white/8 dark:bg-[#111111]">
            <div className="space-y-1">
              <p className="text-lg font-semibold text-[color:var(--text-primary)] dark:text-white">Code</p>
              <p className="text-xs text-[color:var(--text-secondary)] dark:text-[#8ca097]">
                Write, run, and submit from the same workspace.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <FilledButton
                onClick={handleRun}
                disabled={running || submitting || isViewingSubmission}
                size="sm"
                className="border-[color:var(--primary)] bg-[color:var(--primary)] text-white hover:border-[color:var(--primary-hover)] hover:bg-[color:var(--primary-hover)] dark:border-white/10 dark:bg-[#191919] dark:hover:border-[#22c55e] dark:hover:bg-[#191919] dark:hover:text-[#22c55e]"
              >
                {running ? "Running..." : "Run"}
              </FilledButton>
              <RoundedButton
                onClick={handleSubmit}
                disabled={submitting || isViewingSubmission}
                size="sm"
                className="text-[#0f1b12]"
              >
                {submitting ? "Submitting..." : "Submit"}
              </RoundedButton>
            </div>

            <div className="flex flex-wrap items-end justify-end gap-3">
              <div className="flex items-center gap-1 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1 dark:border-white/10 dark:bg-[#1a1a1a]">
                <button
                  type="button"
                  onClick={decreaseEditorFontSize}
                  className="grid h-8 w-8 place-items-center rounded-xl text-sm font-semibold text-[color:var(--text-primary)] transition hover:bg-black/5 dark:text-[#cdd7d1] dark:hover:bg-white/8 dark:hover:text-white"
                  aria-label="Decrease editor font size"
                >
                  A-
                </button>
                <div className="min-w-10 text-center text-xs font-semibold text-[color:var(--text-secondary)] dark:text-[#8ca097]">
                  {editorFontSize}px
                </div>
                <button
                  type="button"
                  onClick={increaseEditorFontSize}
                  className="grid h-8 w-8 place-items-center rounded-xl text-sm font-semibold text-[color:var(--text-primary)] transition hover:bg-black/5 dark:text-[#cdd7d1] dark:hover:bg-white/8 dark:hover:text-white"
                  aria-label="Increase editor font size"
                >
                  A+
                </button>
              </div>
              <label className="grid gap-1 text-[9px] uppercase tracking-[0.14em] text-[color:var(--text-secondary)] dark:text-[#8ca097]">
                Language
                <select
                  id="language"
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value as "python" | "c" | "java")
                  }
                  disabled={isViewingSubmission}
                  className="h-8 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-xs text-[color:var(--text-primary)] outline-none dark:border-white/10 dark:bg-[#1d1d1d] dark:text-white"
                >
                  {(problem?.languages || []).map((option) => (
                    <option key={option} value={option}>
                      {option.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div
            className="border-b border-[color:var(--border)] dark:border-white/8"
            style={{ height: `${editorHeight}px` }}
          >
            <MonacoCodeEditor
              language={language}
              value={code}
              onChange={setCode}
              fontSize={editorFontSize}
              readOnly={isViewingSubmission}
              onContentChange={(length) => activity.recordCodeChange(length)}
            />
          </div>

          <div
            className="h-2 cursor-ns-resize bg-[color:var(--card)] dark:bg-[#171717]"
            onMouseDown={startResize}
            role="separator"
            aria-label="Resize editor"
          />

          <div className="flex min-h-0 flex-1 flex-col justify-end bg-[color:var(--surface)] dark:bg-[#121212]">
            <div className="app-scrollbar min-h-[220px] flex-1 overflow-auto border-t border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-4 dark:border-white/8 dark:bg-[#1a1a1a]">
              {bottomTab === "testcases" ? (
                <div className="space-y-3">
                  {visibleTestcases.map((test, index) => {
                    const result = testcaseChecksById.get(test.id);
                    return (
                      <div
                        key={test.id}
                        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 dark:border-white/8 dark:bg-[#222222]"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-[color:var(--text-primary)] dark:text-white">
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
                            <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-secondary)] dark:text-[#8ca097]">
                              Input
                            </p>
                            <pre className="whitespace-pre-wrap rounded-xl bg-[color:var(--surface)] p-3 font-mono text-xs text-[color:var(--text-primary)] dark:bg-[#171717] dark:text-[#dbe7dd]">
                              {test.input || "(empty)"}
                            </pre>
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-secondary)] dark:text-[#8ca097]">
                              Expected Output
                            </p>
                            <pre className="whitespace-pre-wrap rounded-xl bg-[color:var(--surface)] p-3 font-mono text-xs text-[color:var(--text-primary)] dark:bg-[#171717] dark:text-[#dbe7dd]">
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
                        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 dark:border-white/8 dark:bg-[#222222]"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-[color:var(--text-primary)] dark:text-white">
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
                            <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-secondary)] dark:text-[#8ca097]">
                              Expected
                            </p>
                            <pre className="whitespace-pre-wrap rounded-xl bg-[color:var(--surface)] p-3 font-mono text-xs text-[color:var(--text-primary)] dark:bg-[#171717] dark:text-[#dbe7dd]">
                              {result?.expectedOutput ||
                                test.expectedOutput ||
                                "(empty)"}
                            </pre>
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-secondary)] dark:text-[#8ca097]">
                              Actual
                            </p>
                            <pre className="whitespace-pre-wrap rounded-xl bg-[color:var(--surface)] p-3 font-mono text-xs text-[color:var(--text-primary)] dark:bg-[#171717] dark:text-[#dbe7dd]">
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
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 dark:border-white/8 dark:bg-[#222222]">
                  <ExecutionVisualizer
                    language={language}
                    code={code}
                    testcases={problem?.testcases ?? []}
                  />
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap sticky bottom-0 items-center gap-2 border-t border-[color:var(--border)] bg-[color:var(--surface)] px-4 pt-3 dark:border-white/8 dark:bg-[#151515]">
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
                  className="text-[color:var(--text-secondary)] hover:bg-black/5 hover:text-[color:var(--text-primary)] dark:text-[#8ca097] dark:hover:bg-white/5 dark:hover:text-white"
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
