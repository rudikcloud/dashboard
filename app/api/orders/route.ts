import { NextRequest, NextResponse } from "next/server";

const ORDERS_SERVICE_URL =
  process.env.ORDERS_SERVICE_URL ?? "http://orders-service:8002";

function buildOrdersUrl(path: string): string {
  return `${ORDERS_SERVICE_URL.replace(/\/+$/, "")}${path}`;
}

export async function GET(request: NextRequest) {
  const upstream = await fetch(buildOrdersUrl("/orders"), {
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
  const upstream = await fetch(buildOrdersUrl("/orders"), {
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
