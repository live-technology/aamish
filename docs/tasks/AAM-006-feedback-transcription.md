# AAM-006 — Repeatable voice-feedback transcription

## Problem

Voice feedback is currently downloaded, sent to Gemini, interpreted, and counted manually. This is slow, inconsistent, and does not persist transcripts or token usage for later review.

## Acceptance criteria

- One Bun command finds voice feedback that has not been transcribed.
- The Gemini integration uses `gemini-3.7-flash`, sends WebM recordings as audio, and retries temporary 429/503 responses.
- Original-language transcript, English translation, issue summary, confidence, model, and completion time are stored with the feedback.
- Each successful transcription writes an append-only token-usage event.
- Completed feedback is skipped unless an operator explicitly supplies `--force`.
- Operators can limit a batch or target one feedback ID.
- Logs identify records and usage without exposing credentials or audio URLs.

## Out of scope

- Automatic background execution or cron scheduling.
- Sentiment analysis, autonomous issue creation, or AI actions.
- Transcribing non-feedback media.
- Replacing the feedback inbox UI.

## Validation

- `bun test`
- `bun run lint`
- `bun run build`
- Apply migration `007_feedback_transcriptions.sql` to an isolated or beta database.
- Run `bun --env-file=../../.env run feedback:transcribe -- --limit 1` twice and confirm the second run skips the completed record.
