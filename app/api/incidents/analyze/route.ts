import { NextRequest, NextResponse } from "next/server";

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ??
  process.env.NEXT_PUBLIC_AI_BASE_URL ??
  "http://ai-incident-intelligence:8000";

function buildAiUrl(path: string): string {
  return `${AI_SERVICE_URL.replace(/\/+$/, "")}${path}`;
}

export async function POST(request: NextRequest) {
  const payload = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(buildAiUrl("/incident/analyze"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "Unable to reach AI incident analysis service" },
      { status: 502 },
    );
  }

  const responseText = await upstream.text();
  return new NextResponse(responseText, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
