export type IncidentAnalyzePayload = {
  top_k?: number;
  latency_mean_ms: number;
  latency_p95_ms: number;
  error_rate: number;
  request_count: number;
  orders_create_mean_ms: number;
  orders_create_p95_ms: number;
  orders_create_error_rate: number;
  orders_create_count: number;
  flags_eval_mean_ms: number;
  flags_eval_p95_ms: number;
  flags_eval_error_rate: number;
  flags_eval_count: number;
  auth_me_mean_ms: number;
  auth_me_p95_ms: number;
  auth_me_error_rate: number;
  auth_me_count: number;
};

export type IncidentEvidenceItem = {
  feature: string;
  contribution: number;
};

export type IncidentAnalyzeResponse = {
  incident_type: {
    label: string;
    confidence: number;
  };
  root_cause_ranking: Array<{
    service: string;
    confidence: number;
  }>;
  evidence: {
    root_cause: IncidentEvidenceItem[];
    incident_type: IncidentEvidenceItem[];
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function resolveErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (
    isRecord(payload) &&
    "detail" in payload &&
    typeof (payload as { detail?: unknown }).detail === "string"
  ) {
    return (payload as { detail: string }).detail;
  }

  return `Request failed (${status})`;
}

export async function analyzeIncident(
  payload: IncidentAnalyzePayload,
): Promise<IncidentAnalyzeResponse> {
  const response = await fetch("/api/incidents/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const parsed = await parseResponse(response);
  if (!response.ok) {
    throw new Error(resolveErrorMessage(parsed, response.status));
  }

  return parsed as IncidentAnalyzeResponse;
}
