# Development and debugging

## Web application

```bash
cd apps/web
bun install
bun run dev
```

Visit `http://localhost:3000`. Role demonstrations are available at `/admin`, `/enterprise`, and `/employee`.

## Docker

```bash
docker compose up --build
```

This starts local Postgres and the web application. The migration in `packages/db/migrations/001_initial_schema.sql` is applied when the database volume is first created.

## Logs

Server events are newline-delimited JSON. Each API request receives a `requestId`, which appears in the response and corresponding server logs.

```bash
docker compose logs -f web
docker compose logs web | rg '"level":"error"'
docker compose logs web | rg 'meal.preference'
```

The preference endpoint is intentionally authoritative: it reads the stored cutoff inside a transaction and rejects any change at or after the cutoff time.
