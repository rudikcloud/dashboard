# Dashboard (Next.js + TypeScript)

`dashboard` is the RudikCloud web UI scaffold for Milestone 0.
The home page calls auth-service health and displays the result.

## Required environment variables

- `NEXT_PUBLIC_AUTH_BASE_URL`: Base URL for auth-service.
  - Local example: `http://localhost:8001`
  - Docker Compose network example: `http://auth-service:8000`

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

## Endpoint behavior

- `/` renders: `Auth health: <status>`
- Status is fetched from `${NEXT_PUBLIC_AUTH_BASE_URL}/health`
