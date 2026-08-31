# AAM-005 — Colocate Vercel functions with Neon

## Problem

Internal testers report lag across Aamish. The active Vercel deployment runs its dynamic functions in Washington, D.C. (`iad1`), while the Neon database is in AWS Singapore (`ap-southeast-1`). Database-backed requests therefore make an unnecessary cross-continent round trip.

## Acceptance criteria

- Vercel builds every Aamish server function in Singapore (`sin1`).
- The region is version-controlled and applies consistently to preview and production deployments.
- The existing application build and lint checks pass.
- The deployed Aamish administrator, enterprise administrator, and employee journeys remain functional.
- The deployed function region and representative response latency are checked after deployment.

## Out of scope

- Query consolidation or page-level performance refactoring.
- Multi-region database replication.
- Third-party monitoring or observability services.
- General UI changes.

## Validation

- `bun run lint` from `apps/web`
- `bun run build` from `apps/web`
- Inspect the preview deployment and confirm its functions show `[sin1]`.
- Exercise the three authenticated user journeys and inspect Vercel logs for unexpected errors.
