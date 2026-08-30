# AAM-003 — Internal beta readiness polish

## Problem

Tomorrow's internal testers must be able to complete the three-role journey without hidden mobile navigation, raw system error codes, preventable schedule mistakes, or unclear upload failures.

## Acceptance criteria

- Super-admin navigation remains usable at narrow/mobile widths.
- Enterprise-admin identity and sign-out controls remain available on mobile.
- Package and review uploads reject unsupported or oversized images before upload.
- Menu publishing prevents duplicate package choices and past/expired schedules.
- Common API failures are presented as concise human-readable messages.
- Desktop and mobile layouts have no horizontal overflow in the affected screens.
- Unit tests, lint, production build, Docker journey smoke test, and logs pass.

## Out of scope

- New business capabilities, monitoring services, email, WhatsApp, or Baileys integration.
- Package, schedule, employee, or enterprise editing/deletion workflows.
- Production-readiness claims or real customer data.

## Validation

- `bun test`
- `bun run lint`
- `bun run build`
- Three-role Docker smoke journey
- Desktop and 390 px responsive browser inspection

