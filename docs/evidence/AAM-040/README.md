# AAM-040 validation evidence

Validated on 2026-09-02 against a fresh PostgreSQL 16 database and the production Docker image using disposable multi-tenant data.

## Automated checks

- `bun test`: 79 passed, 0 failed.
- `bun run lint`: passed.
- `bun run build`: passed.

## Journey and data checks

- The employee calendar displayed historical, today, and planned services with receiving/skipping, selected menu, cutoff, and review states.
- A meal received in January 2020 accepted its first review, proving submission has no age expiry.
- The review persisted its one photo and a 60-second voice recording.
- Re-submission updated the review, photo, and voice while preserving the original `created_at` edit deadline.
- A review older than 24 hours returned `409 REVIEW_EDIT_WINDOW_CLOSED` and remained read-only in the employee UI.
- Unit coverage permits the exact 24-hour boundary and rejects the next millisecond.
- A 61-second voice payload returned `400 INVALID_REVIEW_VOICE_DURATION`.
- A current-day meal and another tenant's meal both returned `REVIEW_NOT_AVAILABLE`.
- `DELETE /api/reviews` returned `405`; employees cannot delete a review.
- Enterprise and Aamish administrator review pages rendered authorized voice playback.
- The enterprise review page contained only its own employees and did not expose the other tenant's seeded review.
- Structured review events included request ID, actor, review, schedule, photo count, voice presence, and update state without review content or secrets.

## Screenshots

- `calendar-desktop.png`: historical/current/planned calendar at 1440 × 900.
- `calendar-mobile.png`: actionable calendar at 390 × 844.
- `review-protected-desktop.png`: read-only review after the edit window.
- `review-editable-desktop.png`: editable historical review with preserved photo and voice.
- `review-mobile.png`: historical review editing at 390 × 844.

No production customer data, credentials, or uploaded test media are included in this evidence.
