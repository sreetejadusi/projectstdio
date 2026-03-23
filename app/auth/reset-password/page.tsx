"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextInput } from "@/components/ui/TextInput";
import { fetchApi } from "@/lib/utils/http";

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
    <div className="grid min-h-screen place-items-center p-4">
      <Card title="Reset password" className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required />
          {message ? <p className="text-sm text-[color:var(--text-secondary)]">{message}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !token}>{loading ? "Updating..." : "Reset password"}</Button>
            <Link href="/auth" className="inline-flex h-10 items-center justify-center rounded-lg border border-[color:var(--border)] px-4 text-sm text-[color:var(--text-secondary)]">Back</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center p-4 text-sm text-[color:var(--text-secondary)]">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
