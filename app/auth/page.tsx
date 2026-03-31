"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FilledButton, RoundedButton } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { fetchApi } from "@/lib/utils/http";

type LoginData = {
  userId: string;
  role: "student" | "instructor" | "admin";
  organizationId?: string;
};

type RegisterData = LoginData;

const GITAM_EMAIL_PATTERN = /^[^@\s]+@([a-z0-9-]+\.)*gitam\.(edu|in)$/i;

type SessionData = {
  userId: string;
  role: "student" | "instructor" | "admin";
  organizationId?: string;
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  const validateEmail = (email: string) =>
    GITAM_EMAIL_PATTERN.test(email.trim().toLowerCase());

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!validateEmail(form.email)) {
        throw new Error(
          "Use your GITAM email address (*.gitam.edu or *.gitam.in).",
        );
      }

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

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSessionCheck = useCallback(async () => {
    try {
      await fetchApi<SessionData>("/api/auth/session");
      router.push("/dashboard");
    } catch {
      // no-op, used only to surface cookie-backed login state if present
    }
  }, [router]);

  useEffect(() => {
    void handleDemoSessionCheck();
  }, [handleDemoSessionCheck]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_28%),linear-gradient(180deg,rgba(243,251,245,0.92),rgba(207,238,214,1))] px-4 py-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.12),transparent_24%),linear-gradient(180deg,#101612,#0b100d)] md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_30px_80px_rgba(20,83,45,0.12)] dark:bg-[color:var(--surface)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative flex flex-col justify-between overflow-hidden border-b border-[color:var(--border)] bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_32%),linear-gradient(160deg,#effcf2,#dbf5e3_55%,#f6fff7)] p-8 dark:border-r dark:border-b-0 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.2),transparent_30%),linear-gradient(160deg,#102017,#0d1711_55%,#14221a)] md:p-10">
          <div>
            <img src="/logo.svg" alt="" className="w-1/3" />

            <div className="mt-10 max-w-xl">
              <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em] text-[color:var(--text-primary)] dark:text-white">
                Learn, solve, and upskill code in one focused workspace.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-[color:var(--text-secondary)]">
                Built for programmers. Access assignments, solve coding
                problems, visualize execution, and keep your entire learning
                loop in a single professional interface.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              "Structured classrooms and assignments",
              "Live problem solving with execution tracing",
              "Structured courses and learning paths for all skill levels",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-[color:var(--border)] bg-white/70 p-4 text-sm leading-6 text-[color:var(--text-secondary)] shadow-[0_12px_30px_rgba(20,83,45,0.06)] dark:bg-white/5"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center bg-[color:var(--surface)] p-6 md:p-8">
          <div className="w-full max-w-md rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-[0_22px_50px_rgba(20,83,45,0.08)] dark:bg-[color:var(--card)]">
            <div className="flex gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1">
              <button
                type="button"
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  mode === "login"
                    ? "bg-[color:var(--primary)] text-white"
                    : "text-[color:var(--text-secondary)]"
                }`}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  mode === "signup"
                    ? "bg-[color:var(--primary)] text-white"
                    : "text-[color:var(--text-secondary)]"
                }`}
                onClick={() => setMode("signup")}
              >
                Register
              </button>
            </div>

            <div className="mt-6">
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[color:var(--text-primary)]">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                {mode === "login"
                  ? "Sign in to continue to your classrooms, coding workspace, and submissions."
                  : "Register with your email to access classrooms, problem solving, and course work."}
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <TextInput
                  label="Full name"
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="Your full name"
                  required
                />
              ) : null}
              <TextInput
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="name@email.com"
                required
              />
              <TextInput
                label="Password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder="Minimum 8 characters"
                required
              />

              {error ? (
                <div className="rounded-2xl border border-[color:var(--error)]/30 bg-[color:var(--error)]/10 px-4 py-3 text-sm text-[color:var(--error)]">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center gap-3 pt-2">
                <FilledButton type="submit" full disabled={loading}>
                  {loading
                    ? "Please wait..."
                    : mode === "login"
                      ? "Login"
                      : "Register"}
                </FilledButton>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
