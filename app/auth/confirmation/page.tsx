"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchApi } from "@/lib/utils/http";

function ConfirmationContent() {
  const params = useSearchParams();
  const email = useMemo(() => params.get("email") || "", [params]);
  const status = useMemo(() => params.get("status") || "pending", [params]);
  const [message, setMessage] = useState(
    status === "invalid" ? "Confirmation link is invalid or expired." : "Check your email to confirm your account.",
  );
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    if (!email) {
      setMessage("Missing email. Go back and login again.");
      return;
    }

    setLoading(true);
    try {
      await fetchApi<{ sent: true }>("/api/auth/resend-confirmation", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage("Confirmation email sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to resend email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card title="Confirm your account" className="w-full max-w-md">
        <p className="text-sm text-[color:var(--text-secondary)]">{message}</p>
        {email ? <p className="mt-2 text-xs text-[color:var(--text-secondary)]">Email: {email}</p> : null}
        <div className="mt-4 flex gap-2">
          <Button onClick={resend} disabled={loading}>{loading ? "Sending..." : "Resend"}</Button>
          <Link href="/auth" className="inline-flex h-10 items-center justify-center rounded-lg border border-[color:var(--border)] px-4 text-sm text-[color:var(--text-secondary)]">Back</Link>
        </div>
      </Card>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center p-4 text-sm text-[color:var(--text-secondary)]">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
