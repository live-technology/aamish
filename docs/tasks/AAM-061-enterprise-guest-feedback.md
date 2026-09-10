# AAM-061 — Enterprise guest feedback

## Problem
Event guests need a QR-ready URL for their enterprise to rate their meal without an account. Enterprise administrators need to read their own guest feedback, while Aamish administrators can read all enterprises.

## Acceptance criteria
- One stable `/feedback/<enterprise-id>` URL per active enterprise; no event setup.
- Required integer rating 1–5; optional written review and optional voice up to two minutes.
- Optional name and phone, with a Stay anonymous option that hides and discards both on client and server.
- Submission confirmation, retained data on failure, safe retries, bounded requests and shared rate limits.
- Guest feedback navigation for both administrator roles, QR-ready link, newest-first pagination, and private voice playback.
- No guest/employee access to inbox or audio; enterprise administrators cannot access another enterprise's feedback.
- Deploy to dev only; owner releases main. Confirm main/dev remain mergeable.

## Out of scope
Events, QR generation, analytics, exports, moderation, transcription, notifications, redesigning existing reviews, production release, and real event/customer data during validation.

## Validation
Run bun test, bun run lint, bun run build in apps/web. Apply ordered migration 014 in an isolated database. Validate Docker anonymous/identified/rating-only/voice submission, retries, invalid inputs, role and tenant isolation, desktop/mobile form and inbox, and structured logs. Verify dev deployment and use synthetic test records only.
