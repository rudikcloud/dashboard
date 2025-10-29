"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { authRequest, type User } from "../lib/auth-client";
import { PageHeader } from "../components/ui/page-header";
import { ErrorState, LoadingSkeleton } from "../components/ui/states";

type ServiceProbe = {
  name: string;
  status: "healthy" | "requires_auth" | "offline";
  detail: string;
};

async function probeService(url: string): Promise<ServiceProbe["status"]> {
  try {
    const response = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });

    if (response.ok) {
      return "healthy";
    }

    if (response.status === 401 || response.status === 403) {
      return "requires_auth";
    }

    return "offline";
  } catch {
    return "offline";
  }
}

function statusLabel(status: ServiceProbe["status"]): string {
  if (status === "healthy") return "Healthy";
  if (status === "requires_auth") return "Auth Required";
  return "Unavailable";
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceProbe[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        let user: User | null = null;
        try {
          user = await authRequest<User>("/me");
        } catch {
          user = null;
        }

        const [authStatus, ordersStatus, flagsStatus, auditStatus] =
          await Promise.all([
            probeService(`${process.env.NEXT_PUBLIC_AUTH_BASE_URL ?? "http://localhost:8001"}/health`),
            probeService("/api/orders"),
            probeService("/api/flags?environment=dev"),
            probeService("/api/audit/events?limit=1&offset=0"),
          ]);

        if (!active) return;

        setCurrentUser(user);
        setServices([
          {
            name: "Auth Service",
            status: authStatus,
            detail: "Session and identity",
          },
          {
            name: "Orders Service",
            status: ordersStatus,
            detail: "Order API and worker status",
          },
          {
            name: "Feature Flags",
            status: flagsStatus,
            detail: "Flag management and evaluation",
          },
          {
            name: "Audit Service",
            status: auditStatus,
            detail: "Searchable audit trail",
          },
        ]);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load overview");
        setServices([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const healthyCount = useMemo(
    () => services.filter((service) => service.status === "healthy").length,
    [services],
  );

  return (
    <main className="page">
      <PageHeader
        title="System Overview"
        description="Operational snapshot of identity, orders, flags, and audit services."
        actions={
          <div className="actions">
            <Link href="/orders" className="button">
              Create Order
            </Link>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="button button-secondary"
            >
              Open Grafana
            </a>
          </div>
        }
        meta={
          <>
            <span className="pill">
              {currentUser ? `Signed in: ${currentUser.email}` : "Not signed in"}
            </span>
            <span className="pill">Healthy services: {healthyCount}/{services.length || 4}</span>
          </>
        }
      />

      {loading ? <LoadingSkeleton title="Loading system status" lines={5} /> : null}

      {error ? (
        <ErrorState
          message={error}
          action={
            <button
              type="button"
              className="button button-secondary"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          }
        />
      ) : null}

      {!loading && !error ? (
        <section className="overview-grid">
          {services.map((service) => (
            <article key={service.name} className="card overview-card">
              <div className="overview-card__header">
                <h3>{service.name}</h3>
                <span className={`health-indicator health-${service.status}`}>
                  {statusLabel(service.status)}
                </span>
              </div>
              <p>{service.detail}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="card">
        <h3>Quick Links</h3>
        <div className="actions">
          <Link href="/orders" className="button button-secondary">
            Orders
          </Link>
          <Link href="/flags" className="button button-secondary">
            Feature Flags
          </Link>
          <Link href="/audit" className="button button-secondary">
            Audit Logs
          </Link>
          <Link href="/demo" className="button button-secondary">
            Demo Controls
          </Link>
        </div>
      </section>
    </main>
  );
}
