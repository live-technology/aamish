# AAM-024 independent QA assignment

Use persona: `aamish-super-admin-tester`

Environment: local internal beta at `http://localhost:3003`, branch `feat/AAM-024-quality-feedback`, using an already authenticated disposable Super Admin browser session. Observation only: do not mutate statuses, triage, fixtures, or repository files. Never inspect secrets, cookies, credentials, uploaded media, or database exports.

Validate only these journeys at 1280 × 900 and 390 × 844:

1. `/admin/quality` separates confirmed food incidents, unclassified product bugs, and CSAT reviews.
2. Default food-issue view never labels an unclassified product bug as a confirmed incident.
3. Triage preserves original report/transcript, clearly labels suggestions as reviewable, and exposes category, severity, status, meal date, and Save.
4. CSAT preserves daily trend, date drill-down, rating, comment, employee, organization, menu, timestamp, and photo count.
5. `/admin/feedback` preserves text, voice, pending transcript, transcript/translation/summary, submitter, page, type/status filters, search, and lifecycle control.
6. Cross-links keep Food quality and Product feedback distinct; navigation current states are correct.
7. Check keyboard/focus, long text, 44 px actions, clipping, fixed-navigation overlap, and horizontal overflow.
8. Report console errors and visible request IDs.

Follow every applicable check in `docs/testing/antigravity-visual-qa.md`. Pay special attention to:

- CSAT bars, scores, and date labels remaining aligned at both viewports;
- long original reports, transcripts, translations, and summaries wrapping inside their cards;
- audio controls staying inside the product-feedback card;
- the `UNCLASSIFIED BUG`, `HUMAN CLASSIFIED`, severity, and lifecycle badges not colliding;
- the four triage fields and Save action remaining reachable at 390 px;
- mobile bottom navigation and the feedback trigger not covering the last card or mutation result.

Save these images when their fixture exists:

```text
docs/evidence/AAM-024/antigravity/desktop-quality-issues.png
docs/evidence/AAM-024/antigravity/desktop-csat.png
docs/evidence/AAM-024/antigravity/desktop-product-feedback.png
docs/evidence/AAM-024/antigravity/mobile-quality-issues.png
docs/evidence/AAM-024/antigravity/mobile-csat.png
docs/evidence/AAM-024/antigravity/mobile-product-feedback.png
```

Return the JSON format from `docs/testing/antigravity-personas.md` and save it to `docs/evidence/AAM-024/antigravity/report.json`. If the authenticated fixture or browser permission is unavailable, report one blocker and stop. Do not retry headlessly.
