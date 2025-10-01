"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
    <main className="page">
      <h1>Register</h1>

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

      {error ? <p className="error">{error}</p> : null}

      <p>
        Already have an account? <Link href="/login">Login</Link>
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
