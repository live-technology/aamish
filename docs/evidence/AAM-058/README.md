# AAM-058 — Validation evidence

Validated on 2026-09-09 using the `feat/AAM-058-landing-page` worktree, a Docker web build at `http://127.0.0.1:53060`, and a fresh PostgreSQL 16 container. All users, enquiries, and audio fixtures were synthetic. The two playable audio fixtures are generated tones, not recordings of people.

## Automated checks

| Check | Result |
| --- | --- |
| `cd apps/web && bun test` | 128 passed, 0 failed; 366 assertions |
| `cd apps/web && bun run lint` | Passed |
| `cd apps/web && bun run build` | Passed; root, inbox, submission, status, and audio routes compile |
| `docker build -t aamish-aam058-web apps/web` | Passed |
| Ordered migrations 001–013 in an empty PostgreSQL database | Passed |
| `git diff --check` | Passed |

The isolated integration harness verified 16 checks: Docker root response; text persistence; concurrent retry deduplication; payload-conflict rejection; required-contact/requirement rejection; cross-origin rejection; voice-only WebM persistence; combined text/MP4 persistence; forged-media rejection; all three login destinations; role restrictions on inbox/status/audio; authenticated audio streaming; HTTP range playback; persisted status update; invalid-status rejection; and shared database contact-rate enforcement.

Additional media checks passed: actual video disguised as audio was rejected; a 123-second recording was rejected; neither invalid-media request was persisted; unsigned provider URLs returned access-denied/not-found responses for all saved test recordings. Accepted recordings use Cloudinary authenticated delivery, and the authorized application proxy successfully returned the audio bytes and ranges.

A separate database-outage test stopped only the task's isolated PostgreSQL container. The browser displayed an error and retained both typed fields. After restarting the database, retry succeeded and the database contained exactly one enquiry for that synthetic contact.

## Browser checks

- Desktop at 1440 × 1000 and mobile at 390 × 844: supplied SVGs, correct tagline, sign-in position, offerings, enquiry form, success state, and footer inspected. Mobile document width equals viewport width; no horizontal scrolling.
- Blank submission exposes requirement and contact errors and focuses the first invalid field.
- A valid synthetic mobile enquiry submits and displays the promised confirmation.
- Signed-in Aamish administrator can see that same enquiry, update New → Contacted, refresh, and retain the updated status.
- Voice request detail opens and its private WebM recording plays to completion in the browser (`ended: true`, `currentTime: 2.008`, `duration: 2.008`).
- Mobile administrator navigation promotes Meal requests and the enquiry table becomes stacked rows.
- A pending microphone permission state exposes Cancel microphone request. Native permission-dialog interaction/capture could not be fully verified in the in-app browser; physical-device recorder validation remains AAM-058-F1.
- Root marketing copy contains neither internal-beta/preview labels nor generated-photo references. Existing login beta copy remains unchanged as part of the original signed-in journey.

## Screenshots

### Anchor navigation refinement

Landing anchors use native smooth scrolling only when the visitor has no reduced-motion preference. This preserves fragment URLs, browser history, and interruptible scrolling. The rule is scoped to documents containing the landing page; `/login` was confirmed to retain `scroll-behavior: auto`.

Validated in the rebuilt Docker preview at 1440×1000 and 390×844. The hero CTA was observed mid-transition at scroll position 100.5 before settling at 1902.5, with the request section aligned to the viewport. Mobile offering navigation was observed mid-transition, and the corporate-meal link reached the request section without horizontal overflow. Reduced-motion behavior was checked in the conditional CSS; this browser does not expose preference emulation. All 128 tests, lint, and the production build passed again.

| Evidence | File |
| --- | --- |
| Revised landing hero, desktop | [landing-desktop.png](landing-desktop.png) |
| Revised landing hero, mobile | [landing-mobile.png](landing-mobile.png) |
| Request destination, desktop | [request-arrival-desktop.png](request-arrival-desktop.png) |
| Request destination, mobile | [request-arrival-mobile.png](request-arrival-mobile.png) |
| Mobile submission confirmation | [request-success-mobile.png](request-success-mobile.png) |
| Mobile failed-save state with retained input | [request-failure-mobile.png](request-failure-mobile.png) |
| Administrator inbox, desktop | [inbox-desktop.png](inbox-desktop.png) |
| Administrator inbox, mobile | [inbox-mobile.png](inbox-mobile.png) |

## Manual validation for reviewers

1. Apply migration 013 to an isolated Neon/PostgreSQL database, configure the existing database/session/media variables, and run the Docker web application.
2. As a guest, inspect `/` at desktop and mobile widths, follow each offering link, and submit an empty form. Confirm both field errors, then submit a written requirement with a valid phone or email.
3. In a browser with microphone access, record, stop, preview, remove, and re-record. Test voice-only and combined submissions, denied/cancelled permission, and the two-minute limit. Verify contact remains mandatory.
4. Interrupt the database or upload connection in that isolated environment. Confirm an error rather than false success, retained form data, and a successful duplicate-safe retry after recovery.
5. Sign in as `SUPER_ADMIN`, open **Meal requests**, expand text/audio, play the recording, update status, and refresh. Check 25-item pagination when the fixture set exceeds one page.
6. As an enterprise administrator, employee, and anonymous visitor, verify the inbox redirects and the new admin APIs return 403. Confirm Sign in still routes all roles to their existing workspaces.
7. Inspect structured server logs. Expected rejection events carry status/request IDs; request contents, contact details, provider credentials, and signed audio URLs must be absent.

## Explicit limits and environment notes

The target Neon branch has not been migrated and nothing has been publicly deployed or merged. Native iOS/Android recording and automated retention/orphan reconciliation remain the documented follow-ups in [AAM-058](../../tasks/AAM-058-landing-page.md). Immediate failed-save cleanup is implemented, but abrupt process termination and delayed provider completion still need scheduled reconciliation before broad traffic. The task-scoped QA environment used the existing valid split Cloudinary keys because the local URL-form setting was invalid; original user environment files were unchanged.
