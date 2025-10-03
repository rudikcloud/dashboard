# Dashboard (Next.js + TypeScript)

`dashboard` is the RudikCloud web UI. Milestone 1 adds auth pages and session-aware home state.

## Required environment variables

- `NEXT_PUBLIC_AUTH_BASE_URL`: Base URL for auth-service.
  - Local example: `http://localhost:8001`
  - Docker Compose example: `http://localhost:8001`
- `ORDERS_SERVICE_URL`: Server-side base URL used by dashboard API proxy for orders-service.
  - Local `npm run dev` example: `http://localhost:8002`
  - Docker Compose default: `http://orders-service:8002` (when env var is unset)
- `FLAGS_SERVICE_URL`: Server-side base URL used by dashboard API proxy for flags-service.
  - Local `npm run dev` example: `http://localhost:8003`
  - Docker Compose default: `http://flags-service:8000` (when env var is unset)
- `AUDIT_SERVICE_URL`: Server-side base URL used by dashboard API proxy for audit-service-java.
  - Local `npm run dev` example: `http://localhost:8004`
  - Docker Compose default: `http://audit-service-java:8000` (when env var is unset)
- `AUDIT_INGEST_TOKEN`: Shared internal token sent by dashboard API proxy as `X-Internal-Token` when requesting audit-service-java.
  - Local/Docker default used in examples: `dev-audit-token`

Example env file:

```bash
cp .env.example .env.local
```

## Run locally

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open: `http://localhost:3000`

## Run with Docker

Build:

```bash
docker build -t dashboard .
```

Run:

```bash
docker run --rm -p 3000:3000 --env-file .env.example dashboard
```

## Port

- App: `3000`

## Pages

- `/`: calls `GET /me` on auth-service with `credentials: "include"`.
  - Logged in -> shows `Logged in as {email}` and Logout button.
  - Not logged in -> shows links to Login/Register.
- `/login`: email/password form calling `POST /auth/login`.
- `/register`: email/password form calling `POST /auth/register`.
- `/orders`: shows current user's orders and allows creating a new order.
  - Browser calls dashboard `GET /api/orders` and `POST /api/orders` with `credentials: "include"`.
  - Dashboard forwards the session cookie to orders-service `GET /orders` and `POST /orders`.
  - Orders table shows `checkout_variant` and notification fields (`notification_status`, `notification_attempts`, `notification_last_attempt_at`, `notification_last_error`) returned by orders-service.
  - Notification status is highlighted with badges (`pending`, `retrying`, `sent`, `failed`).
  - Failed rows show a `Retry` action that calls dashboard `POST /api/orders/{id}/retry-notification`, which forwards to orders-service.
- `/flags`: simple feature flag management UI for `dev` environment.
  - Create flag and edit `enabled`, `rollout_percent`, `allowlist`.
  - Browser calls dashboard `GET/POST /api/flags` and `PUT /api/flags/{key}` with `credentials: "include"`.
  - Dashboard forwards the session cookie to flags-service endpoints.
  - If a flag key already exists in the same environment, UI now shows a friendly update message.
- `/audit`: audit log search page.
  - Supports action/resource/date filters.
  - Browser calls dashboard `GET /api/audit/events`; dashboard proxies to audit-service-java with `X-Internal-Token`.
  - Event rows link to `/audit/{id}` detail page showing `before_json`, `after_json`, and `metadata_json`.

## Cookie/session behavior

- Auth requests include `credentials: "include"` so browser stores/sends auth httpOnly cookie.
- Session persistence is controlled by auth-service cookie/session settings.
