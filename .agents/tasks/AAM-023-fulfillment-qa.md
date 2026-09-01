# AAM-023 independent QA assignment

Use persona: `aamish-super-admin-tester`

## Environment

- Local internal-beta application: `http://localhost:3003`
- Branch: `feat/AAM-023-fulfillment-dashboard`
- Use the already authenticated disposable Super Admin browser session.
- Observation only. Do not create, edit, or delete application records.
- Never inspect `.env*`, `.vercel`, cookies, credentials, uploaded media, or database exports.

## Journey

Validate only the Fulfillment redesign:

1. Open `/admin/fulfillment` and confirm the shared Super Admin shell identifies Fulfillment as current.
2. Confirm summary totals equal the visible opted-in allocation rows.
3. Confirm the default next-seven-days view groups counts by service, organization, delivery location, and menu option.
4. Confirm the Dhaka cutoff state distinguishes `CHOICES OPEN` from `COUNT LOCKED`.
5. Exercise service-period, exact-date, and organization/location/menu search filters; confirm Reset restores the default.
6. Open `/admin/operations` and confirm it redirects to `/admin/fulfillment`.
7. Check 1280 × 900 and 390 × 844 for clipping, horizontal overflow, covered actions, unreadable text, or targets smaller than 44 px.
8. Check keyboard navigation, visible focus, and meaningful control labels.
9. Report console errors and visible request IDs. Do not test unrelated routes.

## Expected fixture

The page may be empty after local cleanup. If it is empty, validate the empty-state explanation and direct Service calendar action, then report loaded-state checks as `BLOCKED_FIXTURE` rather than creating data.

## Report

Return the JSON format from `docs/testing/antigravity-personas.md` and save the independent result to:

`docs/evidence/AAM-023/antigravity-report.json`

Do not edit any other repository file.
