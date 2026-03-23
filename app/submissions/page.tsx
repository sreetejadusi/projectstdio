import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const submissions = [
  { problem: "Two Sum", status: "Accepted", runtime: "44 ms", language: "Python", date: "2026-03-06" },
  { problem: "Merge Intervals", status: "Wrong Answer", runtime: "-", language: "Java", date: "2026-03-05" },
  { problem: "LRU Cache", status: "Runtime Error", runtime: "-", language: "C", date: "2026-03-04" },
];

export default function SubmissionsPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Submission History</p>
          <h1 className="mt-1 text-3xl font-semibold">Submissions</h1>
        </header>

        <Card>
          <div className="overflow-hidden rounded-xl border border-[color:var(--border)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#fff7eb] text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">
                <tr>
                  <th className="px-3 py-2">Problem</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Runtime</th>
                  <th className="px-3 py-2">Language</th>
                  <th className="px-3 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, index) => (
                  <tr key={`${submission.problem}-${submission.date}`} className={index % 2 === 0 ? "bg-white/70" : "bg-transparent"}>
                    <td className="px-3 py-3">{submission.problem}</td>
                    <td className="px-3 py-3">
                      <Badge tone={submission.status === "Accepted" ? "success" : submission.status === "Wrong Answer" ? "warning" : "danger"}>
                        {submission.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">{submission.runtime}</td>
                    <td className="px-3 py-3">{submission.language}</td>
                    <td className="px-3 py-3">{submission.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
