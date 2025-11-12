"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Boxes,
  CircleCheckBig,
  Flag,
  Shield,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { GlowPanel } from "../components/ui/glow-panel";
import { PageHeader } from "../components/ui/page-header";
import { ErrorState, LoadingSkeleton } from "../components/ui/states";
import { StatusBadge } from "../components/ui/status-badge";
import { authRequest, type User } from "../lib/auth-client";

type ServiceProbe = {
  id: "auth" | "orders" | "flags" | "audit";
  name: string;
  status: "healthy" | "requires_auth" | "offline";
  detail: string;
  href: string;
};

const SERVICE_DESCRIPTORS: Omit<ServiceProbe, "status">[] = [
  {
    id: "auth",
    name: "Auth Service",
    detail: "Cookie sessions and identity validation",
    href: "http://localhost:8001/health",
  },
  {
    id: "orders",
    name: "Orders Service",
    detail: "Order creation, notifications, and status tracking",
    href: "/orders",
  },
  {
    id: "flags",
    name: "Feature Flags",
    detail: "Rollout control with allowlists and percentages",
    href: "/flags",
  },
  {
    id: "audit",
    name: "Audit Service",
    detail: "Event ingestion and searchable history",
    href: "/audit",
  },
];

const SERVICE_ICON = {
  auth: Shield,
  orders: ShoppingCart,
  flags: Flag,
  audit: Activity,
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
  if (status === "healthy") return "healthy";
  if (status === "requires_auth") return "requires_auth";
  return "offline";
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
          { ...SERVICE_DESCRIPTORS[0], status: authStatus },
          { ...SERVICE_DESCRIPTORS[1], status: ordersStatus },
          { ...SERVICE_DESCRIPTORS[2], status: flagsStatus },
          { ...SERVICE_DESCRIPTORS[3], status: auditStatus },
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

  const statusText = useMemo(() => {
    if (loading) {
      return "syncing";
    }

    if (healthyCount === services.length && services.length > 0) {
      return "healthy";
    }

    if (healthyCount > 0) {
      return "degraded";
    }

    return "offline";
  }, [healthyCount, loading, services.length]);

  return (
    <main className="page">
      <PageHeader
        eyebrow="Workspace"
        icon={<Boxes size={18} aria-hidden />}
        title="System Overview"
        description="Live platform snapshot across identity, orders, feature flags, audit logs, and operations tooling."
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

      <GlowPanel className="glow-panel-card">
        <section className="card overview-hero">
          <div className="overview-hero__content">
            <h3>Operational posture</h3>
            <p>
              Validate health quickly, jump to core workflows, and keep the platform
              demo-ready from one central surface.
            </p>
            <div className="overview-hero__chips">
              <span className="pill">Mode: local</span>
              <span className="pill">Services: {services.length || 4}</span>
            </div>
          </div>
          <div className="overview-hero__status">
            <div className={`overview-hero__status-ring overview-state-${statusText}`}>
              <CircleCheckBig size={28} aria-hidden />
            </div>
            <p className="muted">Overall status</p>
            <StatusBadge status={statusText} />
          </div>
        </section>
      </GlowPanel>

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
          {services.map((service) => {
            const Icon = SERVICE_ICON[service.id];

            return (
              <GlowPanel key={service.name} className="glow-panel-card">
                <article className="card overview-service">
                  <div className="overview-service__header">
                    <span className="overview-service__icon" aria-hidden>
                      <Icon size={16} />
                    </span>
                    <StatusBadge status={statusLabel(service.status)} />
                  </div>
                  <div className="overview-service__body">
                    <h3>{service.name}</h3>
                    <p>{service.detail}</p>
                  </div>
                  <div className="overview-service__footer">
                    <Link href={service.href} className="button button-secondary button-compact">
                      Open
                      <ArrowUpRight size={14} aria-hidden />
                    </Link>
                  </div>
                </article>
              </GlowPanel>
            );
          })}
        </section>
      ) : null}

      <GlowPanel className="glow-panel-card">
        <section className="card overview-quick-links">
          <h3>Quick Links</h3>
          <div className="overview-quick-links__grid">
            <Link href="/orders" className="overview-link-tile">
              <ShoppingCart size={16} aria-hidden />
              <span>Orders</span>
            </Link>
            <Link href="/flags" className="overview-link-tile">
              <Flag size={16} aria-hidden />
              <span>Feature Flags</span>
            </Link>
            <Link href="/audit" className="overview-link-tile">
              <Activity size={16} aria-hidden />
              <span>Audit Logs</span>
            </Link>
            <Link href="/demo" className="overview-link-tile">
              <Boxes size={16} aria-hidden />
              <span>Demo Controls</span>
            </Link>
          </div>
        </section>
      </GlowPanel>
    </main>
  );
}
