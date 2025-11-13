"use client";

import { Eye, FileSearch, ShieldCheck } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { DataTableShell } from "../../components/ui/data-table-shell";
import { GlowPanel } from "../../components/ui/glow-panel";
import { PageHeader } from "../../components/ui/page-header";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../components/ui/states";
import { StatusBadge } from "../../components/ui/status-badge";
import { useToast } from "../../components/ui/toast";
import {
  getAuditEvent,
  listAuditEvents,
  type AuditEvent,
} from "../../lib/audit-client";

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

function isWriteAction(actionType: string): boolean {
  const normalized = actionType.toLowerCase();
  return (
    normalized.includes("create") ||
    normalized.includes("update") ||
    normalized.includes("delete") ||
    normalized.includes("login")
  );
}

export default function AuditPage() {
  const { showToast } = useToast();

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!selectedEvent) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedEvent(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selectedEvent]);

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
  }, [actionType, from, resourceType, to]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return events;
    }

    return events.filter((event) => {
      return (
        event.action_type.toLowerCase().includes(query) ||
        event.resource_type.toLowerCase().includes(query) ||
        (event.resource_id ?? "").toLowerCase().includes(query) ||
        event.actor_user_id.toLowerCase().includes(query)
      );
    });
  }, [events, search]);

  const writeEventsCount = useMemo(
    () => filteredEvents.filter((event) => isWriteAction(event.action_type)).length,
    [filteredEvents],
  );

  const handleFilterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadEvents();
  };

  const handleOpenDetails = async (id: string) => {
    setDetailLoading(true);
    try {
      const eventDetail = await getAuditEvent(id);
      setSelectedEvent(eventDetail);
    } catch {
      showToast({
        variant: "error",
        title: "Unable to load event details",
        description: "Please try again.",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <main className="page">
      <PageHeader
        eyebrow="Compliance"
        icon={<ShieldCheck size={18} aria-hidden />}
        title="Audit Logs"
        description="Search and inspect immutable platform events by actor, action, resource, and timestamp."
        meta={
          <>
            <span className="pill">Events: {filteredEvents.length}</span>
            <span className="pill">Write actions: {writeEventsCount}</span>
          </>
        }
      />

      <GlowPanel className="glow-panel-card">
        <section className="card">
          <h3>Filters</h3>
          <form className="form filter-grid" onSubmit={handleFilterSubmit}>
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
              <span>From (ISO timestamp)</span>
              <input
                type="text"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                placeholder="2026-03-10T00:00:00Z"
              />
            </label>

            <label className="field">
              <span>To (ISO timestamp)</span>
              <input
                type="text"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder="2026-03-11T00:00:00Z"
              />
            </label>

            <div className="actions filter-grid__actions">
              <button className="button" type="submit">
                Apply Filters
              </button>
            </div>
          </form>
        </section>
      </GlowPanel>

      {loading ? <LoadingSkeleton title="Loading audit logs" lines={6} /> : null}

      {error ? (
        <ErrorState
          message={error}
          action={
            <button
              type="button"
              className="button button-secondary"
              onClick={() => void loadEvents()}
            >
              Retry
            </button>
          }
        />
      ) : null}

      {!loading && !error ? (
        <DataTableShell
          title="Events"
          description="Filtered audit trail with quick access to before/after payload details."
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by action, resource, actor, or id"
          pagination={<p>{filteredEvents.length} events</p>}
        >
          {filteredEvents.length === 0 ? (
            <EmptyState
              title="No audit events"
              description="No records match the current filters."
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Actor</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((auditEvent) => (
                  <tr key={auditEvent.id}>
                    <td>{formatDate(auditEvent.created_at)}</td>
                    <td>
                      <div className="audit-action-cell">
                        <StatusBadge
                          status={isWriteAction(auditEvent.action_type) ? "enabled" : "pending"}
                        />
                        <span>{auditEvent.action_type}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{auditEvent.resource_type}</strong>
                      {auditEvent.resource_id ? (
                        <div className="muted">{auditEvent.resource_id}</div>
                      ) : null}
                    </td>
                    <td>{auditEvent.actor_user_id}</td>
                    <td>
                      <button
                        type="button"
                        className="button button-secondary button-compact"
                        onClick={() => void handleOpenDetails(auditEvent.id)}
                        disabled={detailLoading}
                        aria-label={`View details for event ${auditEvent.id}`}
                      >
                        <Eye size={15} aria-hidden />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DataTableShell>
      ) : null}

      {selectedEvent ? (
        <div className="dialog-overlay" role="presentation">
          <div className="dialog dialog-xwide" role="dialog" aria-modal="true">
            <div className="dialog__header">
              <div className="dialog__icon" aria-hidden>
                <FileSearch size={16} />
              </div>
              <h3>Audit Event Details</h3>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span>Event ID</span>
                <strong>{selectedEvent.id}</strong>
              </div>
              <div className="detail-item">
                <span>Created</span>
                <strong>{formatDate(selectedEvent.created_at)}</strong>
              </div>
              <div className="detail-item">
                <span>Action</span>
                <strong>{selectedEvent.action_type}</strong>
              </div>
              <div className="detail-item">
                <span>Resource</span>
                <strong>
                  {selectedEvent.resource_type}
                  {selectedEvent.resource_id ? `:${selectedEvent.resource_id}` : ""}
                </strong>
              </div>
              <div className="detail-item">
                <span>Actor</span>
                <strong>{selectedEvent.actor_user_id}</strong>
              </div>
              <div className="detail-item">
                <span>IP</span>
                <strong>{selectedEvent.ip_address ?? "-"}</strong>
              </div>
            </div>

            <section className="detail-json">
              <h4>Before JSON</h4>
              <pre className="json-block">{formatJson(selectedEvent.before_json)}</pre>
            </section>

            <section className="detail-json">
              <h4>After JSON</h4>
              <pre className="json-block">{formatJson(selectedEvent.after_json)}</pre>
            </section>

            <section className="detail-json">
              <h4>Metadata JSON</h4>
              <pre className="json-block">{formatJson(selectedEvent.metadata_json)}</pre>
            </section>

            <div className="dialog__actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
