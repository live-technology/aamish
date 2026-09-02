# Master PRD traceability matrix

This matrix records the approved Aamish MVP behavior and the acceptance evidence required before an implementation can be considered aligned. The repository [product requirements](product-requirements.md) are authoritative; older notes and current beta behavior are superseded where they conflict.

| Role / contract | Approved behavior | Acceptance evidence |
| --- | --- | --- |
| Aamish administrator — cutoff | One platform-wide `Asia/Dhaka` cutoff defaults to `00:05`, is editable from the dashboard, and is not entered during daily publication. | Authorized dashboard journey; publication without cutoff input; stored setting and structured log. |
| Aamish administrator — cutoff change | A change immediately recalculates every service dated today or later, even when the prior cutoff passed. Dates before today remain unchanged. | Earlier/later change tests, reopen/lock scenarios, Dhaka date-boundary test, affected-count confirmation. |
| Aamish administrator — reviews | Can read CSAT, text, photos, and voice across enterprises, subject to authenticated Super Admin access. | Cross-enterprise authorized read and unauthorized-role denial tests. |
| Enterprise administrator — reviews | Can read CSAT, text, photos, and voice only for employees in the authenticated enterprise. | Two-enterprise isolation tests and playback journey. |
| Employee — calendar | Can see historical meal/review state, today, and planned services. Eligible current/future preferences remain editable only before the recalculated cutoff. | Historical/current/planned, received/skipped, open/locked, reviewed/unreviewed state tests. |
| Employee — review submission | Can review any previous opted-in/received meal without a submission expiry using CSAT and optional text, up to five photos, and one voice recording up to 60 seconds. | Old-meal submission test, media validation, and tenant-isolation tests. |
| Employee — review editing | Can update review content for exactly 24 hours after initial submission. Re-submission does not extend the deadline; afterward the review is readable but cannot be edited or deleted. | Boundary tests immediately before/at/after 24 hours and repeated-update test preserving `created_at`. |
| MVP boundary | D2C ordering, D2C teaser, notifications, meal-off reasons, and administrator review editing are excluded. | Navigation and scope review showing no implied unsupported capability. |

## Superseded legacy decisions

- Per-enterprise or per-service cutoff entry is replaced by the single platform-wide dashboard setting.
- A fixed seven-day review submission window is replaced by submission without expiry for a received meal.
- Unbounded review editing is replaced by an exact 24-hour window measured from initial submission.
- Photo review behavior remains; voice is additive and does not replace text or photos.
- A D2C "Coming Soon" employee tab is not part of the MVP.
