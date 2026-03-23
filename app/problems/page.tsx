import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const problems = [
  { id: "array-sum", title: "Two Sum", difficulty: "easy", topic: "Arrays", acceptance: "49%", solved: "2.1M" },
  { id: "func-compose", title: "Function Composition", difficulty: "medium", topic: "Functions", acceptance: "38%", solved: "420K" },
  { id: "class-cache", title: "LRU Cache", difficulty: "hard", topic: "Classes", acceptance: "27%", solved: "190K" },
  { id: "recursion-tree", title: "Binary Tree Paths", difficulty: "easy", topic: "Recursion", acceptance: "63%", solved: "930K" },
  { id: "dp-grid", title: "Unique Paths II", difficulty: "medium", topic: "Dynamic Programming", acceptance: "41%", solved: "640K" },
];

export default function ProblemsPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <header>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Problem Bucket</p>
          <h1 className="mt-1 text-3xl font-semibold">Problems</h1>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Filter by difficulty, topic, and acceptance to build focused practice sessions.</p>
        </header>

        <Card>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input className="h-10 rounded-lg border border-[color:var(--border)] bg-white px-3 text-sm outline-none" placeholder="Search problem title" />
            <select className="h-10 rounded-lg border border-[color:var(--border)] bg-white px-3 text-sm outline-none">
              <option>All Difficulty</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
            <select className="h-10 rounded-lg border border-[color:var(--border)] bg-white px-3 text-sm outline-none">
              <option>All Topics</option>
              <option>Arrays</option>
              <option>Functions</option>
              <option>Classes</option>
              <option>Recursion</option>
              <option>Dynamic Programming</option>
            </select>
            <select className="h-10 rounded-lg border border-[color:var(--border)] bg-white px-3 text-sm outline-none">
              <option>Sort: Popularity</option>
              <option>Sort: Difficulty</option>
              <option>Sort: Acceptance</option>
            </select>
          </div>
        </Card>

        <Card>
          <div className="overflow-hidden rounded-xl border border-[color:var(--border)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#fff7eb] text-xs uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">
                <tr>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Difficulty</th>
                  <th className="px-3 py-2">Topic</th>
                  <th className="px-3 py-2">Acceptance</th>
                  <th className="px-3 py-2">Solved</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem, index) => (
                  <tr key={problem.id} className={index % 2 === 0 ? "bg-white/70" : "bg-transparent"}>
                    <td className="px-3 py-3 text-[color:var(--success)]">●</td>
                    <td className="px-3 py-3 font-medium">{problem.title}</td>
                    <td className="px-3 py-3">
                      <Badge tone={problem.difficulty === "easy" ? "success" : problem.difficulty === "medium" ? "warning" : "danger"}>{problem.difficulty}</Badge>
                    </td>
                    <td className="px-3 py-3 text-[color:var(--text-secondary)]">{problem.topic}</td>
                    <td className="px-3 py-3">{problem.acceptance}</td>
                    <td className="px-3 py-3">{problem.solved}</td>
                    <td className="px-3 py-3">
                      <Link href={`/problem/${problem.id}`} className="text-[color:var(--primary-hover)]">Open</Link>
                    </td>
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
