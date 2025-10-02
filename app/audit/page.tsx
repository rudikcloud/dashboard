"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { listAuditEvents, type AuditEvent } from "../../lib/audit-client";

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionType, setActionType] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAuditEvents({
        actionType: actionType.trim() || undefined,
        resourceType: resourceType.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
        limit: 50,
        offset: 0,
      });
      setEvents(result);
      setError(null);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Failed to load audit events";
      setError(message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [actionType, resourceType, from, to]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleFilterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadEvents();
  };

  return (
    <main className="page">
      <h1>Audit Logs</h1>

      <section className="card">
        <h2>Filters</h2>
        <form className="form" onSubmit={handleFilterSubmit}>
          <label className="field">
            <span>Action Type</span>
            <input
              type="text"
              value={actionType}
              onChange={(event) => setActionType(event.target.value)}
              placeholder="FLAG_UPDATED"
            />
          </label>

          <label className="field">
            <span>Resource Type</span>
            <input
              type="text"
              value={resourceType}
              onChange={(event) => setResourceType(event.target.value)}
              placeholder="FLAG"
            />
          </label>

          <label className="field">
            <span>From (ISO)</span>
            <input
              type="text"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              placeholder="2026-03-10T00:00:00Z"
            />
          </label>

          <label className="field">
            <span>To (ISO)</span>
            <input
              type="text"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="2026-03-11T00:00:00Z"
            />
          </label>

          <button className="button" type="submit">
            Apply Filters
          </button>
        </form>
      </section>

      {loading ? <p>Loading audit events...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error ? (
        <section className="card">
          <h2>Events</h2>
          {events.length === 0 ? (
            <p>No audit events found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Created At</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Actor</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {events.map((auditEvent) => (
                  <tr key={auditEvent.id}>
                    <td>{auditEvent.created_at}</td>
                    <td>{auditEvent.action_type}</td>
                    <td>
                      {auditEvent.resource_type}
                      {auditEvent.resource_id ? `:${auditEvent.resource_id}` : ""}
                    </td>
                    <td>{auditEvent.actor_user_id}</td>
                    <td>
                      <Link href={`/audit/${auditEvent.id}`}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      <p>
        <Link href="/">Back to Home</Link>
      </p>
    </main>
  );
}
