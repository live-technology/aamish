# AAM-025 independent QA assignment

Use persona: `aamish-enterprise-admin-tester`

Environment: local internal beta at `http://localhost:3003`, branch `feat/AAM-025-enterprise-meals`, with an authenticated disposable Enterprise Admin session. Observation only: do not create employees, upload CSV files, change data, or edit repository files. Never inspect secrets, cookies, credentials, or database exports.

Validate only at 1280 × 900 and 390 × 844:

1. `/enterprise` answers what is happening today: confirmed meals, employee count, delivery locations, 30-day rating, and next services.
2. `/enterprise/meals` survives direct navigation and refresh and keeps the enterprise workspace identity.
3. The 14-day meal plan groups each service by date, then location, then option; zero-order options remain visible.
4. Search, location, and date filters combine correctly; Clear filters restores all rows.
5. Cutoff, service status, menu title, option label, and confirmed count remain legible and unambiguous.
6. Empty and no-match states explain the difference between no published service and filters with no result.
7. `People & reviews` still opens the unchanged beta management experience; do not assess its redesign in this task.
8. Check focus visibility, 44 px actions, wrapping, clipping, bottom-navigation overlap, and horizontal overflow.

Follow `docs/testing/antigravity-visual-qa.md`, especially:

- long organization, location, and menu names must wrap inside their cards;
- counts and status badges must not collide;
- no meal card, logo, icon, or navigation item may stretch or overflow;
- mobile filters must remain usable without horizontal scrolling;
- the last meal option must remain above fixed mobile navigation.

Save:

```text
docs/evidence/AAM-025/antigravity/desktop-overview.png
docs/evidence/AAM-025/antigravity/desktop-meals.png
docs/evidence/AAM-025/antigravity/mobile-overview.png
docs/evidence/AAM-025/antigravity/mobile-meals.png
docs/evidence/AAM-025/antigravity/report.json
```

If authentication, fixtures, or browser permission is unavailable, report one blocker and stop. Do not retry. The primary coding session will not review or rerun this visual report until the separate visual-QA phase.
