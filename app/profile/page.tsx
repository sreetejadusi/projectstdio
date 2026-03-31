import { AppShell } from "@/components/layout/AppShell";
import { StreakHeatmap } from "@/components/profile/StreakHeatmap";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestContext, requireAuthenticatedUser } from "@/lib/utils/request";

type RecentProblem = {
  submissionId: string;
  submittedAt: string;
  language: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
};

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMonthYear(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function buildStreakDays(timestamps: string[]) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 364);

  const counts = new Map<string, number>();
  for (const timestamp of timestamps) {
    const dayKey = new Date(timestamp).toISOString().slice(0, 10);
    counts.set(dayKey, (counts.get(dayKey) ?? 0) + 1);
  }

  const days: Array<{ date: string; count: number }> = [];
  for (let index = 0; index < 365; index += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const key = current.toISOString().slice(0, 10);
    days.push({
      date: key,
      count: counts.get(key) ?? 0,
    });
  }

  return days;
}

function buildCurrentStreak(days: Array<{ date: string; count: number }>) {
  let streak = 0;

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index]?.count) {
      streak += 1;
      continue;
    }

    if (index === days.length - 1) {
      continue;
    }

    break;
  }

  return streak;
}

export default async function ProfilePage() {
  const context = await getRequestContext();
  const auth = requireAuthenticatedUser(context);
  const db = getSupabaseServerClient();

  const [{ data: user, error: userError }, { data: submissions, error: submissionsError }] =
    await Promise.all([
      db
        .from("users")
        .select("id, full_name, email, role, created_at")
        .eq("id", auth.userId)
        .maybeSingle(),
      db
        .from("submissions")
        .select("id, submitted_at, language, problem_id")
        .eq("user_id", auth.userId)
        .order("submitted_at", { ascending: false })
        .limit(12),
    ]);

  if (userError) {
    throw new Error(`Failed to load profile: ${userError.message}`);
  }

  if (submissionsError) {
    throw new Error(`Failed to load recent submissions: ${submissionsError.message}`);
  }

  const problemIds = [...new Set((submissions ?? []).map((submission) => submission.problem_id))];
  const { data: problems, error: problemsError } = problemIds.length
    ? await db.from("problems").select("id, title, difficulty").in("id", problemIds)
    : { data: [], error: null };

  if (problemsError) {
    throw new Error(`Failed to load problem titles: ${problemsError.message}`);
  }

  const problemsById = new Map((problems ?? []).map((problem) => [problem.id, problem]));

  const recentProblems = (submissions ?? []).reduce<RecentProblem[]>((accumulator, submission) => {
      const problem = problemsById.get(submission.problem_id);

      if (!problem || !submission.submitted_at) {
        return accumulator;
      }

      accumulator.push({
        submissionId: submission.id,
        submittedAt: submission.submitted_at,
        language: submission.language,
        title: problem.title,
        difficulty: problem.difficulty,
      });

      return accumulator;
    }, []);

  const streakDays = buildStreakDays(
    (submissions ?? [])
      .map((submission) => submission.submitted_at)
      .filter((value): value is string => Boolean(value)),
  );

  const totalSolved = recentProblems.length;
  const currentStreak = buildCurrentStreak(streakDays);
  const strongestDay = Math.max(...streakDays.map((day) => day.count), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden p-0">
            <div className="bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.2),transparent_28%),linear-gradient(160deg,#effcf2,#dcf6e4_52%,#f8fff9)] p-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_28%),linear-gradient(160deg,#112017,#0f1a13_52%,#16241b)]">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-[color:var(--primary)] text-2xl font-semibold text-white shadow-[0_18px_34px_rgba(34,197,94,0.22)]">
                    {(user?.full_name ?? "FM")
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-secondary)]">
                      Profile
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">
                      {user?.full_name ?? "FrogMatrix Learner"}
                    </h1>
                    <p className="mt-3 text-sm text-[color:var(--text-secondary)]">{user?.email}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone="success">{auth.userRole}</Badge>
                      <Badge tone="neutral">
                        Joined {user?.created_at ? formatMonthYear(user.created_at) : "Recently"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-[color:var(--border)] bg-white/75 px-4 py-4 text-center shadow-[0_14px_28px_rgba(20,83,45,0.06)] dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">Solved</p>
                    <p className="mt-2 text-3xl font-semibold text-[color:var(--text-primary)]">{totalSolved}</p>
                  </div>
                  <div className="rounded-[22px] border border-[color:var(--border)] bg-white/75 px-4 py-4 text-center shadow-[0_14px_28px_rgba(20,83,45,0.06)] dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">Current streak</p>
                    <p className="mt-2 text-3xl font-semibold text-[color:var(--text-primary)]">{currentStreak}</p>
                  </div>
                  <div className="rounded-[22px] border border-[color:var(--border)] bg-white/75 px-4 py-4 text-center shadow-[0_14px_28px_rgba(20,83,45,0.06)] dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">Best day</p>
                    <p className="mt-2 text-3xl font-semibold text-[color:var(--text-primary)]">{strongestDay}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Simple details">
            <dl className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-[color:var(--text-secondary)]">Full name</dt>
                <dd className="text-sm font-medium text-[color:var(--text-primary)]">{user?.full_name ?? "Unknown"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-[color:var(--text-secondary)]">Email</dt>
                <dd className="text-sm font-medium text-[color:var(--text-primary)]">{user?.email ?? "Unknown"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-[color:var(--text-secondary)]">Role</dt>
                <dd className="text-sm font-medium capitalize text-[color:var(--text-primary)]">{auth.userRole}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-[color:var(--text-secondary)]">Member since</dt>
                <dd className="text-sm font-medium text-[color:var(--text-primary)]">
                  {user?.created_at ? formatDateLabel(user.created_at) : "Unavailable"}
                </dd>
              </div>
            </dl>
          </Card>
        </section>

        <Card title="Streak chart">
          <StreakHeatmap days={streakDays} />
        </Card>

        <Card title="Recent submissions">
          {recentProblems.length > 0 ? (
            <div className="space-y-3">
              {recentProblems.map((problem) => (
                <div
                  key={problem.submissionId}
                  className="flex flex-col gap-3 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-[color:var(--text-primary)]">{problem.title}</p>
                    <p className="text-sm text-[color:var(--text-secondary)]">
                      Submitted on {formatDateLabel(problem.submittedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
                    <Badge tone="neutral">{problem.language.toUpperCase()}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-8 text-center text-sm text-[color:var(--text-secondary)]">
              Your submissions will appear here as soon as you start submitting code.
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
