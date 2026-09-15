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

## Acceptance evidence — 15 September 2026
- 136 tests / 402 assertions pass; lint and optimized build pass.
- Docker app: required guest identity, checkbox clearing/reenabling, anonymous submission, employee emoji review save, enterprise inbox access, enterprise editing, unchanged public URL, and no browser exceptions.
- Hosted task preview explicitly points to dev: real Cloudinary upload, creation with logo, replacement/removal, image decoding at 1440/390/320px, rejected foreign URLs, omitted logo preservation, identified and anonymous feedback, unchanged enterprise UUID and slug after edits.
- Corrected empty initial employee date filters found during visual verification, eliminating the “Invalid Date” label.
- Desktop and mobile screenshots: [evidence](../evidence/AAM-063/).

## PM workflow
1. In Organizations, add an enterprise with or without a logo. Edit it to add/replace/remove the logo.
2. Copy its public feedback link and open it signed out on a phone. Confirm Aamish branding, enterprise name/logo, exact copy, and the five emoji scores.
3. Submit without name/phone: validation should ask for them. Enter both, then check Stay anonymous: both must clear. Uncheck it: both are required again.
4. Send one identified and one anonymous review; verify the selected numeric score and review in both Aamish and that enterprise's inbox.
5. Rename the enterprise and change its logo. Open the original link: it must still work.
6. As an employee, open a reviewable meal and submit an emoji rating. Confirm shared branding/copy and the existing review edit window.
