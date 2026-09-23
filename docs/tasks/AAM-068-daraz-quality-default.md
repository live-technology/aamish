# AAM-068 — Daraz quality default and internal-beta review dates

Task: https://github.com/live-technology/aamish/issues/130

The administrator quality page should initially focus on Daraz without requiring a repeated selection. Resolve the active enterprise by its stable slug, not an environment-specific ID. Apply the default only when the enterprise search parameter is absent; explicit empty/all and other-enterprise selections remain unchanged. If Daraz is missing or inactive, retain All enterprises. Enterprise-admin authorization is unchanged.

Acceptance and validation:
- [x] Default Daraz selection on the running Docker application.
- [x] Explicit All enterprises and Alpha QA selection, including server-rendered query URLs.
- [x] Inactive Daraz falls back to All enterprises.
- [x] Desktop and 390×844 mobile inspection; screenshots in `docs/evidence/AAM-068/`.
- [x] `bun test`: 136 passing, zero failures.
- [x] `bun run lint`: pass.
- [x] `bun run build`: pass after installing this branch's locked dependencies.

Docker validation ran this branch's compiled application in the existing Aamish Linux runtime image against a fresh isolated PostgreSQL container. The full fresh Docker image build also completed successfully.

The separately authorized production internal-beta data adjustment was applied transactionally after a rolled-back dry run. The six service dates are September 16, 17, 20, 21, 22 and 23, 2026. There are 386 generated employee meal reviews (64, 64, 63, 66, 62, 67 per day), averaging 4.781, 4.625, 4.603, 4.788, 4.694 and 4.791. The September 24 generated reviews were moved to September 17 with matching schedules and timestamps; September 16 received 64 additional generated reviews. September 24's planned menu remains available without generated reviews. Generated account creation times were aligned where needed. Existing guest feedback (30 records at execution) was checked unchanged by count and content fingerprint. No production data, credentials, or exports are included in this commit.

No schema migration or environment variable change. Out of scope: layout redesign, defaulting enterprise-admin pages to another organization, editing genuine guest feedback. Production code release remains the repository owner's main-merge responsibility. Main was synchronized into dev through #131 before this task branch was created.
