export type AuditEvent = {
  id: string;
  org_id: string | null;
  actor_user_id: string;
  actor_email: string | null;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  before_json: unknown;
  after_json: unknown;
  metadata_json: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function getErrorMessage(payload: unknown, status: number): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "detail" in payload &&
    typeof (payload as { detail?: unknown }).detail === "string"
  ) {
    return (payload as { detail: string }).detail;
  }
  return `Request failed (${status})`;
}

async function fetchAudit(path: string): Promise<unknown> {
  const response = await fetch(path, {
    method: "GET",
    cache: "no-store",
  });
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  return payload;
}

export async function listAuditEvents(filters: {
  actionType?: string;
  resourceType?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditEvent[]> {
  const params = new URLSearchParams();
  if (filters.actionType) params.set("actionType", filters.actionType);
  if (filters.resourceType) params.set("resourceType", filters.resourceType);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (typeof filters.limit === "number") params.set("limit", String(filters.limit));
  if (typeof filters.offset === "number") params.set("offset", String(filters.offset));

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const payload = await fetchAudit(`/api/audit/events${suffix}`);
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload as AuditEvent[];
}

export async function getAuditEvent(id: string): Promise<AuditEvent> {
  const payload = await fetchAudit(`/api/audit/events/${encodeURIComponent(id)}`);
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid audit event response");
  }
  return payload as AuditEvent;
}
