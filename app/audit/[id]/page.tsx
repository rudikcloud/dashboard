"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "../../../components/ui/page-header";
import { ErrorState, LoadingSkeleton } from "../../../components/ui/states";
import { getAuditEvent, type AuditEvent } from "../../../lib/audit-client";

function toSingleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function formatJson(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

export default function AuditEventDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const eventId = useMemo(() => toSingleParam(params?.id), [params]);

  const [auditEvent, setAuditEvent] = useState<AuditEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setError("Missing audit event id.");
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const event = await getAuditEvent(eventId);
        if (!active) return;
        setAuditEvent(event);
        setError(null);
      } catch (requestError) {
        if (!active) return;
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Failed to load audit event";
        setError(message);
        setAuditEvent(null);
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
  }, [eventId]);

  return (
    <main className="page">
      <PageHeader
        title="Audit Event"
        description="Detailed view of a single audit entry and its payload transitions."
        actions={
          <Link href="/audit" className="button button-secondary">
            Back to Audit Logs
          </Link>
        }
      />

      {loading ? <LoadingSkeleton title="Loading audit event" lines={6} /> : null}

      {error ? (
        <ErrorState
          message={error}
          action={
            <button
              type="button"
              className="button button-secondary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          }
        />
      ) : null}

      {!loading && !error && auditEvent ? (
        <>
          <section className="card detail-grid">
            <div className="detail-item">
              <span>ID</span>
              <strong>{auditEvent.id}</strong>
            </div>
            <div className="detail-item">
              <span>Created</span>
              <strong>{formatDate(auditEvent.created_at)}</strong>
            </div>
            <div className="detail-item">
              <span>Action</span>
              <strong>{auditEvent.action_type}</strong>
            </div>
            <div className="detail-item">
              <span>Resource</span>
              <strong>
                {auditEvent.resource_type}
                {auditEvent.resource_id ? `:${auditEvent.resource_id}` : ""}
              </strong>
            </div>
            <div className="detail-item">
              <span>Actor User</span>
              <strong>{auditEvent.actor_user_id}</strong>
            </div>
            <div className="detail-item">
              <span>Actor Email</span>
              <strong>{auditEvent.actor_email ?? "-"}</strong>
            </div>
          </section>

          <section className="card detail-json">
            <h4>Before JSON</h4>
            <pre className="json-block">{formatJson(auditEvent.before_json)}</pre>
          </section>

          <section className="card detail-json">
            <h4>After JSON</h4>
            <pre className="json-block">{formatJson(auditEvent.after_json)}</pre>
          </section>

          <section className="card detail-json">
            <h4>Metadata JSON</h4>
            <pre className="json-block">{formatJson(auditEvent.metadata_json)}</pre>
          </section>
        </>
      ) : null}
    </main>
  );
}
