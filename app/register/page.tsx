"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { PageHeader } from "../../components/ui/page-header";
import { ErrorState } from "../../components/ui/states";
import { authRequest } from "../../lib/auth-client";

export default function RegisterPage() {
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
      await authRequest<{ id: string; email: string }>("/auth/register", {
        method: "POST",
        body: { email: email.trim(), password },
      });
      router.push("/login");
    } catch (registerError) {
      const message =
        registerError instanceof Error ? registerError.message : "Registration failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page auth-page">
      <PageHeader
        title="Create account"
        description="Register a local account to access orders, flags, audit, and demo controls."
      />

      <section className="card auth-card">
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
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
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </section>

      {error ? <ErrorState message={error} /> : null}
    </main>
  );
}
