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

export async function GET(request: NextRequest) {
  const upstreamUrl = new URL(buildFlagsUrl("/flags"));
  copyQueryParams(request.nextUrl, upstreamUrl);

  const upstream = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      cookie: request.headers.get("cookie") ?? "",
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

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const upstream = await fetch(buildFlagsUrl("/flags"), {
    method: "POST",
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
