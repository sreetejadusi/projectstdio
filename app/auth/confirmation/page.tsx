"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchApi } from "@/lib/utils/http";

export default function ConfirmationPage() {
  const params = useSearchParams();
  const email = useMemo(() => params.get("email") || "", [params]);
  const status = useMemo(() => params.get("status") || "pending", [params]);
  const [message, setMessage] = useState<string>(
    status === "invalid" ? "Confirmation link is invalid or expired." : "Check your email to confirm your account.",
  );
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    if (!email) {
      setMessage("Missing email. Go back to login and sign in again.");
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
    <div className="auth-simple-page">
      <Card title="Confirm your account" className="auth-simple-card">
        <p className="muted">{message}</p>
        {email ? <p className="muted">Email: {email}</p> : null}
        <div className="auth-simple-actions">
          <Button onClick={resend} disabled={loading}>
            {loading ? "Sending..." : "Resend confirmation"}
          </Button>
          <Link href="/auth" className="btn btn-secondary">
            Back to login
          </Link>
        </div>
      </Card>
    </div>
  );
}
