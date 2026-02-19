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
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

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
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-panel">
          <div className="auth-brand">
            <img src="/logo-white.svg" alt="STDIO" className="py-2" />
            <p>Secure instructor/student workspace with live grading.</p>
          </div>

          <div className="auth-toggle">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => setMode("signup")}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <TextInput
                label="Full name"
                value={form.fullName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, fullName: event.target.value }))
                }
                placeholder="Ada Lovelace"
                required
              />
            )}

            <TextInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="you@school.edu"
              required
            />

            <TextInput
              label="Password"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="••••••••"
              required
            />

            {mode === "login" ? (
              <Link href="/auth/forgot-password" className="auth-link">
                Forgot password?
              </Link>
            ) : null}

            {error ? <p className="form-error">{error}</p> : null}

            <Button type="submit" full disabled={loading}>
              {loading
                ? "Working..."
                : mode === "login"
                  ? "Login"
                  : "Create account"}
            </Button>
          </form>
        </div>

        <div className="auth-visual">
          <div className="visual-card">
            <h2>Live Assessment</h2>
            <p>
              Real-time insight on code structure, time-on-task, and flowchart
              alignment.
            </p>
            <ul>
              <li>Monaco editor with event capture</li>
              <li>Flowchart matching panel</li>
              <li>Instant run + submit results</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
