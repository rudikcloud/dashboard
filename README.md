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
  - Orders table shows `checkout_variant` returned by orders-service.
- `/flags`: simple feature flag management UI for `dev` environment.
  - Create flag and edit `enabled`, `rollout_percent`, `allowlist`.
  - Browser calls dashboard `GET/POST /api/flags` and `PUT /api/flags/{key}` with `credentials: "include"`.
  - Dashboard forwards the session cookie to flags-service endpoints.

## Cookie/session behavior

- Auth requests include `credentials: "include"` so browser stores/sends auth httpOnly cookie.
- Session persistence is controlled by auth-service cookie/session settings.
