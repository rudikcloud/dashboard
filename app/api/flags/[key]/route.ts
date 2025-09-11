import { NextRequest, NextResponse } from "next/server";

const FLAGS_SERVICE_URL =
  process.env.FLAGS_SERVICE_URL ?? "http://flags-service:8000";

function buildFlagsUrl(path: string): string {
  return `${FLAGS_SERVICE_URL.replace(/\/+$/, "")}${path}`;
}

function copyQueryParams(source: URL, target: URL): void {
  source.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const payload = await request.text();
  const upstreamUrl = new URL(
    buildFlagsUrl(`/flags/${encodeURIComponent(key)}`),
  );
  copyQueryParams(request.nextUrl, upstreamUrl);

  const upstream = await fetch(upstreamUrl, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      cookie: request.headers.get("cookie") ?? "",
    },
    body: payload,
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
