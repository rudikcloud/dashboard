"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { GlowPanel } from "../../components/ui/glow-panel";
import { PageHeader } from "../../components/ui/page-header";
import { ErrorState } from "../../components/ui/states";
import { authRequest } from "../../lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await authRequest<{ status: string }>("/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });
      router.push("/");
      router.refresh();
    } catch (loginError) {
      const message =
        loginError instanceof Error ? loginError.message : "Login failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page auth-page">
      <PageHeader
        eyebrow="Authentication"
        icon={<LogIn size={18} aria-hidden />}
        title="Sign in"
        description="Access the RudikCloud dashboard using your cookie-based session account."
      />

      <GlowPanel className="glow-panel-card">
        <section className="card auth-card">
          <form className="form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </label>

            <button type="submit" className="button" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-card__footer">
            Need an account? <Link href="/register">Create one</Link>
          </p>
        </section>
      </GlowPanel>

      {error ? <ErrorState message={error} /> : null}
    </main>
  );
}
