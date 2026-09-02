# AAM-039 validation evidence

Validated on 2026-09-02 against an isolated PostgreSQL 16 database and the production Docker image.

## Automated checks

- `bun test`: 73 passed, 0 failed.
- `bun run lint`: passed.
- `bun run build`: passed.

## Journey and data checks

- A non-administrator cutoff update returned `403`.
- Publishing a service without a cutoff derived `00:05` in `Asia/Dhaka` from the platform setting.
- Moving the setting from `00:05` to `23:59` recalculated all three services dated today or later, including today's previously locked service.
- Moving the setting back to `00:01` immediately recalculated the same three current/future services.
- The historical service retained its original `10:00` cutoff through both changes.
- Successful changes emitted `platform_cutoff.updated` with request ID, actor ID, old value, new value, and affected-service count.
- The Super Admin dashboard rendered the setting and impact warning at desktop and 390px mobile widths.

## Screenshots

- `dashboard-desktop.png`: Super Admin overview at 1440 × 900.
- `dashboard-mobile.png`: Super Admin overview at 390 × 844.

The environment used disposable test identities and data only. No uploaded media, production data, or credentials are included in this evidence.
