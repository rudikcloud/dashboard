export type FeatureFlag = {
  id: string;
  key: string;
  description: string;
  environment: string;
  enabled: boolean;
  rollout_percent: number;
  allowlist: string[];
  created_at: string;
  updated_at: string;
};

type FeatureFlagCreateInput = {
  key: string;
  description: string;
  environment: string;
  enabled: boolean;
  rollout_percent: number;
  allowlist: string[];
};

type FeatureFlagUpdateInput = {
  description?: string;
  enabled?: boolean;
  rollout_percent?: number;
  allowlist?: string[];
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

export async function listFlags(environment = "dev"): Promise<FeatureFlag[]> {
  const response = await fetch(
    `/api/flags?environment=${encodeURIComponent(environment)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );
  const payload = await parseResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload as FeatureFlag[];
}

export async function createFlag(
  input: FeatureFlagCreateInput,
): Promise<FeatureFlag> {
  const response = await fetch("/api/flags", {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid create flag response");
  }

  return payload as FeatureFlag;
}

export async function updateFlag(
  key: string,
  input: FeatureFlagUpdateInput,
  environment = "dev",
): Promise<FeatureFlag> {
  const response = await fetch(
    `/api/flags/${encodeURIComponent(key)}?environment=${encodeURIComponent(environment)}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );
  const payload = await parseResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid update flag response");
  }

  return payload as FeatureFlag;
}
