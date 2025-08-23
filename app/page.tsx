type HealthResponse = {
  status?: string;
};

export const dynamic = "force-dynamic";

async function getAuthHealth(): Promise<string> {
  const authBaseUrl =
    process.env.NEXT_PUBLIC_AUTH_BASE_URL ?? "http://localhost:8001";

  try {
    const response = await fetch(`${authBaseUrl}/health`, { cache: "no-store" });

    if (!response.ok) {
      return `error (${response.status})`;
    }

    const payload = (await response.json()) as HealthResponse;
    return payload.status ?? "unknown";
  } catch {
    return "unreachable";
  }
}

export default async function Home() {
  const authHealth = await getAuthHealth();

  return (
    <main className="page">
      <h1>RudikCloud Dashboard</h1>
      <p>Auth health: {authHealth}</p>
    </main>
  );
}
