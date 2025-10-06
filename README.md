# dashboard

`dashboard` is the RudikCloud frontend (Next.js + TypeScript). It is the operator-facing UI for authentication, orders, flags, and audit logs.

## Purpose

- Provide a single UI to drive platform workflows.
- Use cookie-based auth with `auth-service`.
- Proxy browser actions to backend services through server-side API routes.

## Pages

- `/` : home/status view (current user state)
- `/login` : email/password login
- `/register` : user registration
- `/orders` : create/list orders + notification status
- `/flags` : feature flag management
- `/audit` : audit event search
- `/audit/[id]` : audit event detail view
- `/demo` : referenced demo path (use `/` as current live demo landing)

## Required Environment Variables

Copy `.env.example` to `.env.local`.

- `NEXT_PUBLIC_AUTH_BASE_URL`: Browser-facing auth-service URL.
- `ORDERS_SERVICE_URL`: Server-side orders-service base URL.
- `FLAGS_SERVICE_URL`: Server-side flags-service base URL.
- `AUDIT_SERVICE_URL`: Server-side audit-service-java base URL.
- `AUDIT_INGEST_TOKEN`: Internal token used when proxying audit requests.

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open: http://localhost:3000

## Run in Docker

```bash
docker build -t dashboard .
docker run --rm -p 3000:3000 --env-file .env.example dashboard
```

## Authentication Behavior

- Login/register call `auth-service` directly from browser with `credentials: include`.
- Browser stores httpOnly session cookie issued by `auth-service`.
- Dashboard API routes forward the incoming cookie to downstream services (`orders-service`, `flags-service`).
- Services validate user identity via `auth-service /me`.

## What to Demo

1. Register + login in the UI.
2. Set `newCheckout` flag in `/flags`.
3. Create order in `/orders`; verify checkout variant + notification status.
4. Open `/audit`; show matching audit event and detail JSON.
5. Open Grafana to connect UI actions to traces.
