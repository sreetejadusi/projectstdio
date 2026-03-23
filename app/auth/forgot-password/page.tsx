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
    event.preventDefault();
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
    <div className="grid min-h-screen place-items-center p-4">
      <Card title="Forgot password" className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@school.edu" required />
          {message ? <p className="text-sm text-[color:var(--text-secondary)]">{message}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
            <Link href="/auth" className="inline-flex h-10 items-center justify-center rounded-lg border border-[color:var(--border)] px-4 text-sm text-[color:var(--text-secondary)]">Back</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
