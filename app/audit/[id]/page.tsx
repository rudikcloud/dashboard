"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

export default function AuditEventDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const eventId = useMemo(() => toSingleParam(params?.id), [params]);
  const [auditEvent, setAuditEvent] = useState<AuditEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setError("Missing event id.");
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
      <h1>Audit Event</h1>

      {loading ? <p>Loading event...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error && auditEvent ? (
        <>
          <section className="card">
            <p>
              <strong>ID:</strong> <code>{auditEvent.id}</code>
            </p>
            <p>
              <strong>Created At:</strong> {auditEvent.created_at}
            </p>
            <p>
              <strong>Action:</strong> {auditEvent.action_type}
            </p>
            <p>
              <strong>Resource:</strong> {auditEvent.resource_type}
              {auditEvent.resource_id ? `:${auditEvent.resource_id}` : ""}
            </p>
            <p>
              <strong>Actor User:</strong> {auditEvent.actor_user_id}
            </p>
            <p>
              <strong>Actor Email:</strong> {auditEvent.actor_email ?? "-"}
            </p>
            <p>
              <strong>IP:</strong> {auditEvent.ip_address ?? "-"}
            </p>
            <p>
              <strong>User Agent:</strong> {auditEvent.user_agent ?? "-"}
            </p>
          </section>

          <section className="card">
            <h2>Before JSON</h2>
            <pre className="json-block">{formatJson(auditEvent.before_json)}</pre>
          </section>

          <section className="card">
            <h2>After JSON</h2>
            <pre className="json-block">{formatJson(auditEvent.after_json)}</pre>
          </section>

          <section className="card">
            <h2>Metadata JSON</h2>
            <pre className="json-block">{formatJson(auditEvent.metadata_json)}</pre>
          </section>
        </>
      ) : null}

      <p>
        <Link href="/audit">Back to Audit Logs</Link>
      </p>
      <p>
        <Link href="/">Back to Home</Link>
      </p>
    </main>
  );
}
