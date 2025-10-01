"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
    <main className="page">
      <h1>Login</h1>

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
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <p>
        Need an account? <Link href="/register">Register</Link>
      </p>
      <p>
        <Link href="/flags">Flags</Link>
      </p>
      <p>
        <Link href="/orders">Orders</Link>
      </p>
      <p>
        <Link href="/audit">Audit</Link>
      </p>
      <p>
        <Link href="/">Back to Home</Link>
      </p>
    </main>
  );
}
