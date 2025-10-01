import { NextRequest, NextResponse } from "next/server";

const AUDIT_SERVICE_URL =
  process.env.AUDIT_SERVICE_URL ?? "http://audit-service-java:8000";
const AUDIT_INGEST_TOKEN = process.env.AUDIT_INGEST_TOKEN ?? "dev-audit-token";

function buildAuditUrl(path: string): string {
  return `${AUDIT_SERVICE_URL.replace(/\/+$/, "")}${path}`;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const suffix = query ? `?${query}` : "";
  const upstream = await fetch(buildAuditUrl(`/audit/events${suffix}`), {
    method: "GET",
    headers: {
      "X-Internal-Token": AUDIT_INGEST_TOKEN,
    },
    cache: "no-store",
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
