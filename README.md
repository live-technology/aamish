# Aamish

> [!WARNING]
> **Aamish is a vibe-coded beta for internal testing only. It is not production-ready.**
>
> Expect incomplete journeys, changing data models, rough edges, and security or operational gaps. Do not expose this build to public users, store sensitive production data, or use it for live food-order operations.

Aamish is a B2B corporate meal-management beta for onboarding enterprises, publishing meal packages, collecting employee preferences, producing kitchen allocations, and reviewing meal quality.

## Current purpose

This repository supports the first internal testing phase. The immediate goal is to validate the three user journeys and improve the product through structured feedback:

1. **Aamish administrator** — create enterprises and locations, manage packages and menu schedules, inspect allocations, and review quality feedback.
2. **Enterprise administrator** — manage the employee roster and delivery-location assignment individually or through CSV import.
3. **Employee** — choose a meal option, opt in or out before cutoff, and submit a rating, comment, and photos.

The beta intentionally excludes production-grade monitoring, email delivery, WhatsApp automation, payment processing, and food-order integrations.

## Technology

- Next.js 16, React 19, and TypeScript
- Bun for package management and local scripts
- Neon Postgres
- Cloudinary for signed image uploads
- Docker Compose for local development
- Vercel as the intended internal web-testing environment
- A future standalone WhatsApp agent under `apps/whatsapp-agent`

## Repository layout

```text
apps/
  web/                 Next.js web platform
  whatsapp-agent/      Reserved for the standalone WhatsApp worker
packages/
  db/migrations/       Ordered Postgres migrations
assets/brand/          Aamish brand assets
docs/                  Product, journey, API, and data-model notes
infra/                 Deployment configuration
```

## Local setup

Requirements: Docker Desktop and Bun.

1. Copy `.env.example` to `.env`.
2. Add the Neon, Cloudinary, and session-secret values.
3. Provision the first super administrator:

   ```bash
   cd apps/web
   bun --env-file=../../.env run bootstrap:admin
   cd ../..
   ```

4. Build and start the local stack:

   ```bash
   docker compose up -d --build
   ```

5. Open `http://localhost:3002/login`.

Never commit `.env`, real credentials, exported user data, or review photos.

## Validation

Run application checks from `apps/web`:

```bash
bun run lint
bun run build
```

For an internal journey test:

1. Sign in as the Aamish administrator and create an enterprise with at least one delivery location.
2. Create active packages with images and publish a menu containing one or more options.
3. Sign in as the enterprise administrator and add or import employees.
4. Sign in as an employee and verify meal selection, opt-in/out, cutoff behavior, and eligible reviews.
5. Return as the Aamish administrator and verify Kitchen operations and Quality & reviews.
6. Inspect structured Docker logs using `docker compose logs --tail=200 web`.

See [docs/test-report.md](docs/test-report.md) for the latest recorded test coverage.

## Internal Vercel deployment

This beta may be deployed only as a protected internal testing environment.

- Set the Vercel Root Directory to `apps/web`.
- Configure `DATABASE_URL`, `SESSION_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in Vercel.
- Use a non-production Neon database or isolated beta branch.
- Enable deployment protection or otherwise restrict access to approved testers.
- Apply every migration in `packages/db/migrations` before testing.
- Never expose bootstrap credentials in source code or the UI.

## Documentation

- [Product requirements](docs/product-requirements.md)
- [User journeys](docs/user-journeys.md)
- [Data model](docs/data-models.md)
- [API specification](docs/api-specification.md)
- [Development notes](docs/development.md)
- [Contribution and PR rules](AGENTS.md)

## Production readiness

Production deployment is explicitly out of scope right now. Before production, Aamish requires at minimum a security review, production authentication strategy, authorization audit, rate limiting, automated tests, backups and recovery testing, observability, incident procedures, data-retention rules, accessibility review, and operational validation of external integrations.
