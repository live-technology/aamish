# AAM-063 — Branded feedback forms and optional enterprise logos

## Problem
Event guests and employees need consistent Aamish feedback branding and an obvious rating control. Operations must add or replace an optional enterprise logo without changing printed feedback QR links.

## Acceptance criteria
- Keep the existing Aamish logo; show a larger enterprise name and its optional logo.
- Both feedback forms say “A little feedback. A better next meal.” and “Tell us how we did, we’re listening”.
- Ratings are required and use 🤩 5, 😋 4, 🙂 3, 😕 2, 😞 1.
- Public feedback requires name and phone unless Stay anonymous is checked. The checkbox follows those fields and clears both values; anonymous submissions discard supplied identity server-side.
- Operations can upload an optional PNG/JPEG/WebP logo during enterprise creation and add, replace or remove it later.
- Editing enterprise details or branding preserves the enterprise ID and existing `/feedback/{enterpriseId}` route.
- Aamish and scoped enterprise administrators retain review access.

## Out of scope
QR generation, domain changes, enterprise deletion/deactivation behavior, main releases, changes to voice/photo storage or review editing windows, unrelated redesigns.

## Validation
Run `bun test`, `bun run lint`, `bun run build` from apps/web. Exercise affected journeys in Docker at desktop/mobile widths with synthetic fixtures. Verify required identity, anonymous clearing, numeric emoji values, administrator review access, and stable URLs after editing. Verify real logo upload on a task preview connected explicitly to the development database before integration.

## Schema and environment
No migration: reuse existing enterprises.logo_url. Reuse the application's configured Cloudinary account. No new environment variables. Logos are public branding images; replacing/removing a logo does not delete old assets, so existing references remain valid. Public form availability still depends on an active enterprise and the original host being retained.
