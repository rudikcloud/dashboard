"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authRequest, type User } from "../lib/auth-client";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        const user = await authRequest<User>("/me");
        if (isMounted) {
          setCurrentUser(user);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
          setError(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCurrentUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authRequest<{ status: string }>("/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setError(null);
    } catch (logoutError) {
      const message =
        logoutError instanceof Error ? logoutError.message : "Logout failed";
      setError(message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="page">
      <h1>RudikCloud Dashboard</h1>

      {loading ? <p>Loading session...</p> : null}

      {!loading && currentUser ? (
        <section className="card">
          <p>
            Logged in as <strong>{currentUser.email}</strong>
          </p>
          <div className="actions">
            <Link href="/orders" className="button button-secondary">
              Orders
            </Link>
            <Link href="/flags" className="button button-secondary">
              Flags
            </Link>
          </div>
          <button
            type="button"
            className="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </section>
      ) : null}

      {!loading && !currentUser ? (
        <section className="card">
          <p>You are not logged in.</p>
          <div className="actions">
            <Link href="/login" className="button">
              Login
            </Link>
            <Link href="/register" className="button button-secondary">
              Register
            </Link>
          </div>
        </section>
      ) : null}

      {error ? <p className="error">{error}</p> : null}
    </main>
  );
}
