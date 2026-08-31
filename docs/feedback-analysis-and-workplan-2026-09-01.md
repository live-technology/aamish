# Aamish internal beta feedback analysis and work plan

**Prepared:** 31 August 2026  
**Proposed work date:** 1 September 2026  
**Audience:** Project manager and internal beta team  
**Decision status:** Awaiting project-manager approval; implementation must not start before approval.

## Executive summary

The first internal team test produced **15 feedback submissions** during a concentrated 75-minute test window. Raw tester labels were 10 bugs, 4 ideas, and 1 question, but those labels do not reliably describe engineering priority. After reviewing the text, five voice transcriptions, affected pages, and current code, the submissions resolve into:

- **9 feedback records** mapped to planned software work;
- **4 records** retained as reviewed backlog;
- **2 meal-quality records** that the platform must compile and surface through a structured quality timeline;
- **7 existing engineering issues** (AAM-008 through AAM-014); and
- **1 new platform quality issue** (AAM-016).

Beta 0.2 foundation work is already released: Vercel production functions run in Singapore, voice transcription and usage tracking are available, and repository merge ownership is documented. The next engineering focus should be employee review reliability, package editing, voice-recorder clarity, and feedback triage.

## Current platform baseline

| Item | State |
|---|---|
| Production domain | `https://aamish.vercel.app` |
| Vercel function region | Singapore (`sin1`), verified after release |
| Voice feedback | 5 of 5 recordings transcribed and persisted |
| Recorded transcription usage | 8,939 tokens across 5 successful events |
| Feedback lifecycle | 9 PLANNED, 4 REVIEWED, 2 NEW |
| Git integration | Task PRs can be created and merged into `dev`; release owner controls `main` |
| Release milestone | [Beta 0.2 — Tester feedback hardening](https://github.com/live-technology/aamish/milestone/1) |

## Chronological feedback timeline

Times below use Asia/Dhaka (UTC+6). Personal names, credentials, and media links are intentionally omitted.

| Time | Role / page | Feedback signal | Analysis | Disposition |
|---|---|---|---|---|
| 10:57 | Super admin / calendar | Add more ghee to rice | Menu preference, not a platform defect | Reviewed backlog; future menu-note capability |
| 10:57 | Super admin / calendar | Hair found in food | Meal hygiene/safety signal | AAM-016 quality classification and timeline |
| 10:58 | Super admin / packages | Created packages cannot be edited | Confirmed missing API and UI capability | AAM-009 |
| 11:04 | Super admin / feedback | Separate problems, ideas, questions, and other | Inbox triage and filtering requirement | AAM-011 |
| 11:06 | Super admin / feedback | Asked whether inbox items are editable | Preserve original content; allow workflow-status changes | AAM-011 |
| 11:28 | Employee / employee portal | Confirmation needed after review submission | Success state is too remote from the form | AAM-008 |
| 11:31 | Super admin / quality | Show date and average-rating graph | Duplicate of later detailed CSAT request | AAM-014 |
| 11:34 | Employee / employee portal | Bangla and English options | Large localization stream, not release hardening | Reviewed backlog |
| 11:36 | Employee / employee portal | Submit button appears not to work | Eligibility and feedback-state reliability problem | AAM-008 |
| 11:46 | Enterprise admin / enterprise portal | Drag-and-drop CSV upload | Existing CSV upload works; requested affordance improvement | Reviewed backlog |
| 11:56 | Super admin / quality | Month-to-date CSAT graph and date drill-down | Detailed quality analytics requirement | AAM-014 |
| 11:59 | Enterprise admin / feedback widget and portal | Recorder shows `0:00`; voice requests orders and review calendar | One submission contains two unrelated topics and must be split | AAM-010, AAM-012, AAM-013 |
| 12:04 | Employee / employee portal | Use emojis instead of stars | Rating-control preference, not a reliability defect | Reviewed backlog |
| 12:06 | Enterprise admin / enterprise portal | Show current and future menus | Core enterprise visibility gap | AAM-012 |
| 12:12 | Employee / employee portal | Spoiled fish; replacement requested | Meal freshness/spoilage signal | AAM-016 quality classification and timeline |

## Voice-transcription analysis

Five recordings were transcribed with high model confidence.

| Source | Meaning | Engineering interpretation |
|---|---|---|
| Calendar voice report | Hair was found in food | Quality/hygiene event; must be contextualized against the meal, date, menu, enterprise, and location |
| Package voice report | Existing packages cannot be edited | Clear missing super-admin capability |
| Quality voice report | Month-to-date daily CSAT graph with a right-side daily-review panel | Concrete interaction design for AAM-014 |
| Enterprise voice report | View active orders by location/date and access employee review calendar | Two coherent enterprise capabilities: AAM-012 and AAM-013 |
| Employee voice report | Fish was spoiled and a replacement was requested | Quality/freshness event; replacement handling is operational, while compilation and timeline are platform responsibilities |

### Important transcription findings

1. Tester-selected category is not sufficient for prioritization. Missing features were frequently labelled as bugs.
2. One submission can contain unrelated typed and spoken topics. The 11:59 record combined a recorder-timer complaint with enterprise dashboard requirements.
3. AI transcription should remain assistive. Original audio/text must remain immutable, and an authorized person must be able to review suggested classification.
4. Meal-quality feedback needs service-date context, not only submission time. A chronological quality view must distinguish when the meal was served from when feedback arrived.

## Consolidated engineering task register

| Priority | Task | Scope | Estimate | Dependencies / notes |
|---|---|---|---|---|
| Done | AAM-005 | Run Vercel functions in Singapore | Complete | Released and verified on production |
| Done | AAM-006 | Automate voice transcription and token accounting | Complete | Migration 007 applied to beta Neon |
| Done | AAM-007 | Define agent merge ownership | Complete | Release owner retains `main` control |
| P0 | [AAM-008](https://github.com/live-technology/aamish/issues/10) | Make employee review submission reliable and visibly confirmed | 0.5 day | First implementation task; blocks trust in employee journey |
| P1 | [AAM-009](https://github.com/live-technology/aamish/issues/11) | Add package editing | 0.5–1 day | Requires authorized update API and responsive edit form |
| P1 | [AAM-010](https://github.com/live-technology/aamish/issues/12) | Show remaining voice-recording time | 0.25 day | Small, isolated feedback-loop improvement |
| P1 | [AAM-011](https://github.com/live-technology/aamish/issues/13) | Add inbox filtering, lifecycle status, and stored transcripts | 0.5–1 day | Builds on AAM-006 schema |
| P1 | [AAM-012](https://github.com/live-technology/aamish/issues/14) | Show enterprise menus and orders by date/location | 1–1.5 days | Must enforce enterprise isolation and avoid query waterfalls |
| P2 | [AAM-013](https://github.com/live-technology/aamish/issues/15) | Add enterprise review visibility | 1–1.5 days | Stretch scope; authorization-sensitive |
| P1 | [AAM-014](https://github.com/live-technology/aamish/issues/16) | Add month-to-date CSAT trend and daily drill-down | 1–1.5 days | Timezone and aggregation tests required |
| P0 | [AAM-015](https://github.com/live-technology/aamish/issues/20) | Compile feedback analysis and approved work plan | Current task | Approval gate; documentation only |
| P1 | [AAM-016](https://github.com/live-technology/aamish/issues/21) | Classify meal-quality feedback and show its timeline | 1–2 days | Complements AAM-014; AI suggestions must remain reviewable |

Estimates are focused engineering time and include implementation, automated checks, responsive inspection, and PR evidence. They are planning ranges, not delivery promises.

## Platform responsibility for food reviews

Food-service resolution is outside the development team's responsibility. The platform is responsible for making the information operationally useful.

AAM-016 should provide:

- classifications for hygiene/safety, freshness/spoilage, taste/preference, portion, packaging, and delivery condition;
- severity that distinguishes critical quality signals from ordinary preferences;
- both meal-service date and submission timestamp;
- enterprise, delivery location, menu/package, rating, and original review/transcript context;
- a chronological timeline with filters and auditable status changes;
- visibly marked AI suggestions that an authorized user can confirm or correct.

The platform must not make medical, legal, replacement, or food-safety decisions autonomously.

## Proposed work plan for 1 September 2026

The proposed day is deliberately limited to work that can be completed and validated coherently.

### Morning — reliability first

1. Confirm project-manager approval and refresh `dev`.
2. Implement AAM-008 on `fix/AAM-008-review-submission`.
3. Test eligible/ineligible reviews, duplicate clicks, create/update behavior, and visible confirmation.
4. Open the AAM-008 PR into `dev`, attach test evidence, and merge only when checks pass.

### Midday — feedback-loop clarity

1. Implement AAM-010 on `fix/AAM-010-recorder-timer`.
2. Add deterministic timer tests.
3. Inspect recording at desktop and 390 px.
4. Open and merge the reviewed PR into `dev` after checks pass.

### Afternoon — administrator correction path

1. Implement AAM-009 on `feat/AAM-009-package-editing`.
2. Validate authorization, input rules, image preservation/replacement, and structured logs.
3. Inspect package cards and edit form at desktop and 390 px.
4. Open the PR into `dev`; merge only if all required evidence is complete.

### End-of-day integration gate

- Run `bun test`, `bun run lint`, and `bun run build` on integrated `dev`.
- Validate the affected super-admin and employee journeys in Docker/preview.
- Inspect structured logs for unexpected errors.
- Publish a concise status: completed, carried forward, blocked, and newly discovered issues.
- Do not merge `dev` into `main` without the release owner's separate approval.

## Follow-on sequence after tomorrow

1. AAM-011 — feedback triage and transcript visibility.
2. AAM-012 — enterprise menu and order visibility.
3. AAM-014 — super-admin CSAT trend and drill-down.
4. AAM-016 — meal-quality classification and timeline, coordinated with the AAM-014 data model.
5. AAM-013 — enterprise review visibility if retained in Beta 0.2.

## Reviewed backlog outside the immediate plan

- Full Bangla/English localization: requires a deliberate localization architecture and content pass.
- Drag-and-drop CSV: polish the existing upload path after core enterprise visibility is stable.
- Emoji ratings: revisit during employee-experience design; stars are currently functional and familiar.
- Menu preference notes such as additional ghee: consider structured package/menu notes rather than treating individual requests as code defects.

## Approval requested

The project manager should approve or revise:

1. Tomorrow's scope: AAM-008, AAM-010, and AAM-009, in that order.
2. Whether AAM-013 remains Beta 0.2 stretch scope or moves to the following release.
3. Whether AAM-016 is required in Beta 0.2 alongside AAM-014.
4. Continued deferral of localization, drag-and-drop CSV, and emoji ratings.

Until approval is recorded, no feedback implementation branch should be started.

## Current blockers and requested support

There is no infrastructure or repository-access blocker. GitHub, Neon, Cloudinary, Gemini, Vercel, and production deployment access are working.

The only current blocker is **project-manager approval of the work plan**. For faster role-journey validation, the team may optionally maintain one dedicated beta test account per role and store credentials only in the local environment or approved secret manager—never in GitHub, documentation, or chat.
