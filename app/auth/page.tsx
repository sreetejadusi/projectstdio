"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Footer } from "@/components/layout/Footer";
import { ApiHttpError, fetchApi } from "@/lib/utils/http";

type LoginData = {
  userId: string;
  role: "student" | "instructor" | "admin";
  organizationId?: string;
};

type RegisterData = {
  userId: string;
  email: string;
  requiresEmailConfirmation: boolean;
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        await fetchApi<LoginData>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        router.push("/dashboard");
        return;
      }

      await fetchApi<RegisterData>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          role: "student",
        }),
      });

      router.push(`/auth/confirmation?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      if (err instanceof ApiHttpError && err.code === "EMAIL_NOT_VERIFIED") {
        router.push(`/auth/confirmation?email=${encodeURIComponent(form.email)}`);
        return;
      }
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_18px_40px_rgba(105,83,55,0.08)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Project Stdio</p>
          <h1 className="mt-2 text-3xl font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Secure coding workspace for learners and instructors.</p>

          <div className="mt-5 flex gap-2 rounded-xl border border-[color:var(--border)] bg-white/80 p-1 shadow-[0_8px_18px_rgba(105,83,55,0.05)]">
            <button type="button" className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === "login" ? "bg-[color:var(--primary)] text-white" : "text-[color:var(--text-secondary)]"}`} onClick={() => setMode("login")}>Login</button>
            <button type="button" className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === "signup" ? "bg-[color:var(--primary)] text-white" : "text-[color:var(--text-secondary)]"}`} onClick={() => setMode("signup")}>Sign Up</button>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <TextInput label="Full name" value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} placeholder="Ada Lovelace" required />
            ) : null}
            <TextInput label="Email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="you@school.edu" required />
            <TextInput label="Password" type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="••••••••" required />
            {mode === "login" ? <Link href="/auth/forgot-password" className="inline-block text-xs text-[color:var(--primary-hover)]">Forgot password?</Link> : null}
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <Button type="submit" full disabled={loading}>{loading ? "Working..." : mode === "login" ? "Login" : "Create account"}</Button>
          </form>
        </section>

        <section className="rounded-2xl border border-[color:var(--border)] bg-[radial-gradient(circle_at_10%_0%,rgba(251,191,36,0.25),transparent_40%),linear-gradient(160deg,#fff8eb,#fff2f0_48%,#fffaf3)] p-6 shadow-[0_18px_40px_rgba(105,83,55,0.08)]">
          <h2 className="text-2xl font-semibold">Developer-first learning</h2>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">LeetCode-style practice, course progression, classroom analytics, and code visualization in one platform.</p>
          <div className="mt-5 space-y-2 text-sm text-[color:var(--text-secondary)]">
            <p>• Problem solving with live runtime feedback</p>
            <p>• Structured curriculum and learning paths</p>
            <p>• Instructor analytics for cohorts</p>
            <p>• Built-in debugger and flow visualization</p>
          </div>
        </section>
      </div>
      <div className="mx-auto mt-4 w-full max-w-5xl">
        <Footer />
      </div>
    </div>
  );
}
