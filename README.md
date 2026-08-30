# Aamish

B2B corporate meal management platform for menu scheduling, employee meal preferences, kitchen aggregation, and meal-quality feedback.

## Repository layout

```text
apps/
  web/                 Main Next.js application (Vercel)
  whatsapp-agent/      Future WhatsApp worker (GCP VM)
packages/
  db/                  Shared database access and migrations
assets/
  brand/               Aamish brand assets
  reference/           Source recordings and reference material
docs/                  Product and technical specifications
infra/                 Deployment configuration
```

## Stack

- Next.js + TypeScript + Bun
- Neon Postgres for production data
- Cloudinary for image storage and delivery
- Vercel for the web platform
- Docker for local development and the future WhatsApp agent

## Documentation

- [Product requirements](docs/product-requirements.md)
- [User journeys](docs/user-journeys.md)
- [Data model](docs/data-models.md)
- [API specification](docs/api-specification.md)
- [Original product overview](docs/product-overview.md)

## Local development

1. Copy `.env.example` to `.env` and add Neon, Cloudinary, and session-secret values.
2. Provision the first super administrator from `apps/web` with `bun --env-file=../../.env run bootstrap:admin`.
3. Start the complete stack with `docker compose up -d --build`.
4. Open `http://localhost:3002/login`.

## Implemented MVP journeys

- Aamish admin: enterprise onboarding with one-or-more delivery locations, package image upload, package options, menu publishing, kitchen allocation, and review quality dashboard.
- Enterprise admin: individual employee creation and CSV roster import.
- Employee: package selection, meal opt-in/out before cutoff, five-star feedback, and up to five Cloudinary photos.
- Operations: structured JSON logs with request IDs, health endpoint, Docker runtime, and Neon-backed migrations.

## Validation sequence

1. Sign in as the Aamish admin and confirm the empty enterprise dashboard.
2. Add an enterprise with at least one location and its first admin login.
3. Add active packages with images, then publish a dated menu with one or more options.
4. Sign out and use the enterprise admin login to add employees or import the CSV template.
5. Sign out and use an employee login to select a package, opt in/out before cutoff, and review an eligible meal.
6. Sign back in as the Aamish admin and confirm Kitchen operations and Quality & reviews.

Run `bun run lint && bun run build` in `apps/web` before deployment. Vercel needs the same environment variables as `.env.example`; its root directory should be `apps/web`.
