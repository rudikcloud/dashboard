import { NextRequest, NextResponse } from "next/server";

const AUDIT_SERVICE_URL =
  process.env.AUDIT_SERVICE_URL ?? "http://audit-service-java:8000";
const AUDIT_INGEST_TOKEN = process.env.AUDIT_INGEST_TOKEN ?? "dev-audit-token";

function buildAuditUrl(path: string): string {
  return `${AUDIT_SERVICE_URL.replace(/\/+$/, "")}${path}`;
}

type Params = Promise<{ id: string }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params },
) {
  const { id } = await params;
  const upstream = await fetch(
    buildAuditUrl(`/audit/events/${encodeURIComponent(id)}`),
    {
      method: "GET",
      headers: {
        "X-Internal-Token": AUDIT_INGEST_TOKEN,
      },
      cache: "no-store",
    },
  );

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
