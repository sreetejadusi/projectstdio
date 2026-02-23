"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextInput } from "@/components/ui/TextInput";
import { fetchApi } from "@/lib/utils/http";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    // event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await fetchApi<{ reset: true }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setMessage("Password reset successful. You can log in now.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-simple-page">
      <Card title="Reset password" className="auth-simple-card">
        <form onSubmit={handleSubmit} className="auth-form">
          <TextInput
            label="New password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />
          {message ? <p className="muted">{message}</p> : null}
          <div className="auth-simple-actions">
            <Button type="submit" disabled={loading || !token}>
              {loading ? "Updating..." : "Reset password"}
            </Button>
            <Link href="/auth" className="btn btn-secondary">
              Back to login
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
