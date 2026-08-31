# Aamish UX audit and capability-preservation contract

Status: proposed redesign baseline  
Task: [AAM-017](https://github.com/live-technology/aamish/issues/32)  
Product status: internal-testing beta, not production-ready

## Purpose

This document separates three things that were previously mixed together:

1. what the application actually supports today;
2. what the product documents describe but the application does not yet support; and
3. what must change in the experience without breaking working behavior.

The redesign may replace navigation, layouts, components, wording, and interaction sequences. It must not silently remove an implemented capability, weaken role isolation, or change a business rule.

## Evidence reviewed

- all pages under `apps/web/src/app`;
- all interactive components under `apps/web/src/components`;
- all API routes and authorization checks;
- migrations `001` through `008`;
- `docs/user-journeys.md`, `docs/product-requirements.md`, and `docs/product-overview.md`;
- global styles in `globals.css`, `admin.css`, and `admin-sections.css`.

## Executive diagnosis

The beta is feature-led rather than task-led. Each new capability introduced its own page structure and styling, but there is no shared model for page hierarchy, navigation, form behavior, feedback, or responsive composition.

The most important usability failures are:

- The super administrator lands on an enterprise list, not an operational dashboard or a clear next action.
- Closely related tasks—creating packages, publishing them, reading counts, and handling quality—feel like separate tools rather than one service lifecycle.
- Enterprise administration is one large client component with three temporary tabs; its state cannot be linked, refreshed, or understood as distinct tasks.
- The employee page shows one active schedule and one review target, while the product language promises today and weekly context.
- Forms expose implementation details such as manually entered slugs and credentials instead of reducing decisions.
- Empty states exist, but loading, inline validation, destructive confirmation, retry, and partial-success patterns are inconsistent or absent.
- Responsive behavior mostly hides columns or swaps navigation at a breakpoint. It does not reprioritize information for mobile tasks.
- Three global CSS files contain overlapping primitives and page-specific selectors. Several components are compressed into very long lines, making visual change risky and review difficult.
- The unused `dashboard.tsx` presents an aspirational dashboard disconnected from real routes and data, which demonstrates that visual intent and implementation have diverged.

## Implemented capability inventory

### Shared access and feedback

| Capability | Current evidence | Preserve during redesign |
| --- | --- | --- |
| Username/password login | `/login`, `POST /api/auth/login` | One login surface and role-directed destination |
| Signed session and role redirects | `auth.ts` and every protected page | Strict `SUPER_ADMIN`, `ENTERPRISE_ADMIN`, and `EMPLOYEE` boundaries |
| Sign out | All portal shells | Clear, reachable sign-out action |
| Text or voice beta feedback | `FeedbackWidget`, `/api/feedback` | Available to every authenticated role without obstructing primary tasks |
| Signed Cloudinary uploads | `/api/uploads/signature` | Menu, review, and feedback upload kinds remain authorized |
| Structured request logging | API route log events and request IDs | Preserve and standardize for all redesigned mutations |

### Aamish super administrator

| Journey | Implemented capability | Current limitation / friction | Preservation requirement |
| --- | --- | --- | --- |
| Enterprise onboarding | Create enterprise, one or more locations, first admin | Long drawer; manual slug; no review step; no post-create credential handoff | Creation remains transactional; at least one location; first admin created |
| Enterprise list | Counts for locations/admins and status | No overview, search, detail, edit, or delete | List and counts remain available; unsupported management actions must not be implied |
| Package library | Create and edit title, description, category, price, image, status | Dense side panel; native file input; no preview or explicit saved state | Create/edit and image preservation on edit remain intact |
| Menu publishing | Select enterprise, one date, cutoff, one or more packages/options | Calendar is a list plus modal, not a calendar; dependencies are only explained after failure | Active-enterprise and active-package prerequisites remain enforced |
| Operations | Counts by date, enterprise, option, location | Flat table; no date control, totals hierarchy, or export | Existing aggregation query and read-only semantics remain |
| Reviews and CSAT | 30-day average, daily bars, day drill-down, low-rating flags | Quality triage and CSAT compete on one dense screen; review photos are counted but not visible | Ratings, comments, timestamps, package/enterprise context, and daily aggregation remain |
| Food-quality triage | Compiles BUG feedback, suggestions, category, severity, status, meal date | Every bug is treated as a possible food issue; controls are dense and save feedback is weak | Original content remains immutable; suggestions remain reviewable, never autonomous |
| Feedback inbox | Type/status filters, audio, transcripts, translation, summary, triage status | No search, detail view, update feedback, or clear pending-transcription state | Original text/audio/transcripts and status transitions remain |

### Enterprise administrator

| Journey | Implemented capability | Current limitation / friction | Preservation requirement |
| --- | --- | --- | --- |
| Meals and orders | Next 14 days, date/location/option/package/cutoff/count, including zero counts | Landing page is a dense table; no date grouping or operational emphasis | All counts remain enterprise-scoped and grouped accurately |
| Reviews | Last 30 days with rating, comment, meal date, package, location, average | Long undifferentiated list; no day/location filter | Enterprise isolation and review detail remain |
| Employee roster | List employee identity, location, status | No search/filter/detail/edit/deactivate | Existing list remains; do not present unsupported actions |
| Single employee creation | Name, ID, email, optional phone, location, username, password | Admin chooses too many account details; feedback shares one message area | Transactional employee/user creation and location scoping remain |
| Bulk employee import | Download CSV and upload up to 500 rows; row failures counted | Template has no real dropdowns; parser is simplistic; errors are not actionable per row | Existing CSV contract remains until separately improved; partial results must be explicit |

### Employee

| Journey | Implemented capability | Current limitation / friction | Preservation requirement |
| --- | --- | --- | --- |
| Upcoming meal | Chooses a preferred option for the selected active schedule | Only one schedule is visually exposed; package imagery is queried but not rendered | Option identity, package copy, and selected state remain |
| Reserve or skip | Toggle before cutoff; locked after cutoff | Cutoff is a timestamp, not a helpful countdown; result feedback is detached | Server-enforced cutoff remains authoritative; state change must be explicit |
| Review meal | Latest eligible received meal within seven days; 1–5 rating, comment, up to five photos; update via upsert | No date chooser or existing-review hydration; upload and save state are weak | Eligibility, edit semantics, photo limit, and review message remain |
| No-meal / no-review states | Explicit empty cards | Both occupy substantial page space and provide little next-step context | Empty state must remain truthful and compact |

## Authorization and data invariants

These are redesign blockers, not visual preferences:

- A super administrator can access all Aamish operational data.
- An enterprise administrator can access only the enterprise ID in the signed session.
- An employee can mutate only their own meal preference and review.
- Delivery locations selected during employee creation must belong to the signed-in enterprise.
- A meal preference cannot change after the schedule cutoff.
- A review is allowed only for an opted-in meal from the current date through seven days back.
- Review media is limited to five trusted Cloudinary images.
- Original platform-feedback content and transcripts are immutable during triage.
- Quality classifications are suggestions until a human saves them.
- No redesign task may use production customer data for validation.

## Documented but not currently implemented

These items are not part of the preservation baseline. They require separate product approval rather than being smuggled into redesign work:

- multiple enterprise admins managed after onboarding;
- enterprise/location editing or deletion;
- generated credentials and secure credential handoff;
- enterprise logos and billing details;
- schedule date ranges and weekly batch publishing;
- kitchen packing-sheet export;
- location-level CSAT participation analytics and review photo gallery;
- true CSV/XLSX templates with location validation dropdowns;
- employee weekly schedule navigation and cutoff countdown;
- employee review-date chooser and review history;
- gamification/reward progress;
- D2C “Coming soon” module;
- password reset, SSO, email, or notification workflows.

## UX severity findings

| Severity | Finding | Consequence |
| --- | --- | --- |
| Critical | No explicit product-wide hierarchy or page contract | Every feature invents its own UX; users relearn the interface |
| Critical | Current CSS and component structure make visual change unsafe | Small changes cause overflow/regressions and expensive manual correction |
| High | Super-admin landing page is not an overview | Operators cannot see what needs attention or where to start |
| High | Enterprise navigation has no durable routes | Refreshing, deep-linking, and browser navigation do not preserve task context |
| High | Employee journey hides schedule context | Users cannot understand upcoming choices or select a review date naturally |
| High | Form design exposes avoidable decisions | Onboarding and account creation feel administrative rather than guided |
| Medium | Status, error, and save feedback lack a shared pattern | Users cannot tell whether actions succeeded, failed, or remain pending |
| Medium | Mobile tables remove columns instead of changing the information model | Important context disappears on small screens |
| Medium | Quality reports and generic platform bugs share one overloaded surface | Operational prioritization is unclear |
| Medium | Text sizes and touch targets are frequently below comfortable UI norms | Readability and mobile accessibility suffer |

## Redesign success measures

The redesign is successful only when evidence supports all of the following:

- A first-time internal tester completes each primary journey without verbal guidance.
- Every page presents one obvious primary task and no more than one primary action.
- Users can always identify their role, current section, current record/date, and system status.
- Repeated entry is removed where the system can derive a value safely.
- All mutations provide pending, success, validation-error, and retry feedback next to the action.
- Core tasks work at 390 px, 768 px, 1280 px, and keyboard-only interaction.
- Text and controls meet WCAG 2.2 AA contrast and focus visibility; touch targets are at least 44 px where practical.
- Existing authorization and business-rule tests remain green.
- Visual regression covers shared components and every primary role landing page.
- The full super-admin → enterprise-admin → employee journey passes in an isolated Docker database.

## Capability-preservation gate for every redesign PR

Each implementation PR must name the affected journey and include:

1. current capability being preserved;
2. redesigned task flow and state model;
3. explicitly unsupported actions;
4. desktop and 390 px evidence;
5. keyboard/focus evidence for changed controls;
6. API and authorization tests for changed mutations;
7. an assertion that no hidden CSS or component fork was introduced.

