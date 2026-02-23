"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextInput } from "@/components/ui/TextInput";
import { fetchApi } from "@/lib/utils/http";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    // event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await fetchApi<{ sent: true }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage("If the email is registered, a reset link has been sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-simple-page">
      <Card title="Forgot password" className="auth-simple-card">
        <form onSubmit={handleSubmit} className="auth-form">
          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@school.edu"
            required
          />
          {message ? <p className="muted">{message}</p> : null}
          <div className="auth-simple-actions">
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
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
