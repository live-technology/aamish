# AAM-061 validation

All records, names, phone values and browser recordings used in these checks are synthetic.

- `bun test`: 133 pass, 0 fail, 386 assertions.
- `bun run lint`: passed.
- `bun run build`: passed.
- Fresh isolated PostgreSQL 16 database: ordered migrations 001–014 passed.
- Docker integration: 12 grouped checks passed, covering anonymous page access, active enterprise links, rating-only/identified/anonymous persistence, concurrent retry deduplication, changed-payload conflicts, bounds/origin/media validation, role and enterprise isolation, and shared rate limits.
- Browser checks: desktop 1440×1000 and mobile 390×844 form/inbox inspected; no horizontal overflow or page errors. Required rating, clearing identity when anonymous, retained input on simulated save failure, successful retry, synthetic microphone recording/stop/remove, admin enterprise filtering and copyable QR URL passed.
- Actual private media upload/playback will be checked on the feature preview using the application's existing configuration; local Docker ran without media credentials.
- Migration 014 applied and verified on the documented isolated Neon dev branch. No release database changes.

## Docker runtime
The repository Dockerfile build could not fetch `oven/bun:1.4.0-alpine` metadata because the registry timed out. Validation used the cached AAM-060 Linux runtime (same unchanged dependency versions) with this task's successful standalone build, static files and public assets copied in. The local dependency symlink was excluded; cached Linux runtime dependencies were retained. No Dockerfile changes are part of the feature.

## Screenshots
- [Guest form desktop](form-desktop.png), [mobile](form-mobile.png)
- [Save failure mobile](failure-mobile.png), [success mobile](success-mobile.png)
- [Enterprise inbox desktop](enterprise-inbox-desktop.png), [mobile](enterprise-inbox-mobile.png)
- [Aamish admin inbox](admin-inbox-desktop.png)

## Reviewer journey
1. Open Guest feedback as an enterprise admin; copy/open the feedback link for that enterprise.
2. In an unsigned-in browser, choose 1–5 stars and submit. Text, voice, name and phone are optional.
3. Enter name/phone, check Stay anonymous, and submit. Confirm the review displays Anonymous with no contact details.
4. Record, preview and submit a short voice message. Both the owning enterprise admin and Aamish admin can play it. Other enterprise admins, employees and guests cannot access it.
5. As Aamish admin, select an enterprise to view its feedback and QR-ready link. Check a second enterprise account sees only its own reviews even when altering URL parameters.

## Scope and limitations
One stable URL per active enterprise, no event management, analytics, export, transcription or QR generation. Existing private media pipeline is reused, including its two-minute/3 MB limits and existing native-device recorder/orphan-cleanup follow-ups documented under AAM-058. Application guest access does not change Vercel deployment protection. The owner must apply migration 014 to the release database before releasing this feature from dev to main. No new environment variables.
