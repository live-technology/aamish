# AAM-058 — Aamish landing page and meal enquiry inbox

Status: implemented and owner-approved for protected dev deployment; dev migration applied on 2026-09-09.
Branch: `feat/AAM-058-landing-page`, based on updated `dev` at `36ba9e3`.
Task link: this written task description.

## Problem and journey

The root route redirected to sign-in. Visitors need to understand Corporate Meals, Banquet Meals, and Bulk Home Orders, then send a requirement without an account. Aamish administrators need to receive and follow up on those enquiries inside their existing workspace.

## Accepted requirements

- English-first landing page with the headline **Meals that feel like from home,** and supporting line **The taste of home, made by five-star chefs.**
- Use the owner's four SVG ingredient illustrations from `assets/brand`; no generated/stock food photographs.
- A typography-led terracotta brand direction with responsive service rows and a prominent enquiry section.
- No internal-beta/preview wording in the landing-page content. This change does not alter hosting access or release authority.
- Sign in at the top right links to the unchanged `/login` and existing role/password-change flows.
- Exactly two form fields: requirement and mandatory phone number or email. A requirement may be text, a playable voice recording, or both.
- Submitted requests persist in Neon-compatible PostgreSQL and appear only to Aamish administrators.
- Confirmation after persistence: **Thank you! Our representatives will contact you to discuss your requirement.**
- Display `01335-114515` and link to the supplied Facebook profile.
- The owner explicitly approved private Cloudinary storage for voice enquiries on 2026-09-09. Contact details and written requirements stay in the database.

## Implementation

- `/` renders the marketing page; Fraunces and DM Sans are served locally with their OFL licenses.
- Original SVG paths/fills are preserved in public copies: `Untitled-1.svg` → `onion.svg`, `Untitled-2.svg` → `tomato.svg`, `Untitled-3.svg` → `chilli.svg`, `Untitled-4.svg` → `garlic.svg`. Original working-copy files remain untouched.
- The form accepts 4,000 text characters, a voice message up to 120 seconds/3 MB, and a validated contact method. Bangladesh numerals/local numbers normalize to international format; international numbers and email are supported.
- Recording controls support stop, preview, removal, re-recording, and cancelling a pending microphone request. Microphone tracks stop on completion/unmount, including a permission response arriving after cancellation.
- `POST /api/meal-requests` reads a bounded multipart body, verifies origin/Host, validates file signatures and provider-inspected audio tracks/duration, and commits before confirmation.
- A UUID submission key plus payload fingerprint and transaction lock prevent duplicate inserts/uploads on concurrent retries; changed content under an existing key returns 409.
- Shared database counters enforce an application-wide ceiling of 100 attempts per 10-minute window and five accepted enquiries per contact per hour. No raw contact data or client IP is stored in counters. Failed transactions do not consume the contact quota. Counters older than two days are pruned after successful submissions.
- Audio is uploaded server-side as Cloudinary `authenticated` video-resource media. Only the storage reference, format, byte count, and measured duration are saved in PostgreSQL. The original upload endpoint remains unchanged.
- `/admin/requests` provides 25-row pagination, text detail, audio playback, explicit refresh, and New/Contacted/Closed status tracking. Mobile uses stacked rows.
- `PATCH /api/admin/meal-requests/[id]` and `GET /api/admin/meal-requests/[id]/audio` verify a current `SUPER_ADMIN` session. Audio is proxied with range support and private/no-store headers; signed provider URLs stay on the server.
- Structured logs include request/record IDs and outcomes, excluding requirement text, contact values, audio contents, and signed URLs. Raw database errors are not logged by these new routes.

## Acceptance criteria

- [x] Landing page presents all three offerings, the supplied tagline, and contact links.
- [x] Owner-provided illustrations replace generated food imagery; no beta-preview copy remains on the landing page.
- [x] Sign in remains at the top right on desktop and mobile; all three login destinations are unchanged.
- [x] Text-only, voice-only, and combined enquiries persist with mandatory valid contact.
- [x] Missing/invalid contact and missing requirements are rejected client-side and server-side.
- [x] Concurrent retries persist exactly one record; changed duplicate payloads are rejected.
- [x] Confirmation appears after persistence; a failed save preserves entered values for retry.
- [x] Administrators can read requests, play private audio, and update follow-up status.
- [x] Anonymous, enterprise-admin, and employee access to inbox/status/audio is rejected.
- [x] Forged audio, video tracks, overlong recordings, and oversized bodies are rejected.
- [x] Desktop and narrow/mobile layouts have screenshot evidence and no horizontal overflow.
- [x] Ordered migrations apply to an empty isolated database; migration/configuration notes are explicit.
- [ ] Complete native microphone capture testing on physical iOS Safari and Android Chrome before broad rollout (AAM-058-F1).

## Migration and configuration

Apply `packages/db/migrations/013_meal_requests.sql` once, after migrations 001–012, to the target Neon branch before deploying the feature. It creates `meal_requests` and `meal_request_rate_limits`; it does not modify existing customer/journey tables. Rollback should disable these routes first; preserve enquiry data rather than dropping populated tables.

Existing `DATABASE_URL`, `SESSION_SECRET`, and Cloudinary settings are reused. No new environment variable is required. A valid `CLOUDINARY_URL` takes precedence; the existing complete split-key configuration also works when that URL is absent. The local QA environment had an invalid URL value, so QA used the existing valid split keys in a task-scoped environment file. No user `.env` file was changed.

On 2026-09-09, migration 013 was applied transactionally to the existing Neon `dev` branch (`br-blue-smoke-azem7zuh`) in project `noisy-bird-65281738`, after checking prerequisite schema through migration 012. Both new tables and their indexes were verified. The Vercel `DATABASE_URL` override scoped to Preview / git branch `dev` was explicitly bound to that database. Vercel Authentication was enabled for Preview deployments. Production configuration and database were not changed.

Microphone capture requires HTTPS or localhost. Uploads remain below the app's 3 MB recording cap; the multipart body adds a maximum 32 KB allowance. Cloudinary-inspected duration allows one second of container/timer overhead. See [Cloudinary authenticated media](https://cloudinary.com/documentation/control_access_to_media) and [audio upload guidance](https://cloudinary.com/documentation/upload_parameters).

## Validation and evidence

See [AAM-058 evidence](../evidence/AAM-058/README.md) for commands, outcomes, screenshots, manual role steps, and known limits.

Required checks from `apps/web`: `bun test`, `bun run lint`, `bun run build`. Docker image build and isolated application checks are also required. The owner approved merging PR #111 into `dev` and deploying the protected internal preview on 2026-09-09. Public deployment and release to `main` remain out of scope.

## Out of scope

Checkout, payments, automatic quotes, scheduling, a full CRM, staff assignment, speech transcription, Bangla UI localization, automated outbound messages, and changes to the existing signed-in journeys. Unrelated WhatsApp-agent work and existing uncommitted changes remain untouched.

## Follow-up tasks and limitations

- **AAM-058-F1 — Native-device recorder validation:** verify microphone permission denial/cancellation, stop/preview/re-record, backgrounding, 120-second limit, and full submission on current physical iOS Safari and Android Chrome. API validation covers WebM and MP4, and browser-admin WebM playback was verified; physical-device capture remains untested.
- **AAM-058-F2 — Enquiry retention and media housekeeping:** agree a retention/deletion policy and add scheduled orphan reconciliation before broad public traffic. Failed upload/save attempts trigger immediate cleanup with a reference check to avoid deleting a committed recording. Cleanup failures log `meal_request.media_cleanup_required`; a process kill or late provider completion after an upload timeout can still leave private orphaned media. No automated retention deletion is included.
- The global beta traffic ceiling is intentionally conservative; public traffic management and edge abuse protection require separate operational review. Text submission works without Cloudinary, with actionable recording errors when media configuration is unavailable.
