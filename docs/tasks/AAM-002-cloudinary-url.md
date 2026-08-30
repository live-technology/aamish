# AAM-002 — Consolidate Cloudinary configuration

## Problem

Cloudinary currently requires three separate environment variables. Vercel and new local environments should use the standard single `CLOUDINARY_URL` value.

## Acceptance criteria

- The application accepts `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` through `CLOUDINARY_URL`.
- Upload-signature generation uses one centralized parser.
- Vercel requires only `CLOUDINARY_URL` for Cloudinary.
- Existing local three-variable configuration remains temporarily compatible during migration.
- Parser behavior has automated tests.

## Out of scope

- Changing upload destinations, transformations, or Cloudinary accounts.
- Migrating or deleting existing Cloudinary assets.
- Deploying to Vercel.

## Validation

- Run `bun run test` in `apps/web`.
- Run `bun run lint` and `bun run build` in `apps/web`.
- Verify an authenticated upload-signature request against the local Docker application.
