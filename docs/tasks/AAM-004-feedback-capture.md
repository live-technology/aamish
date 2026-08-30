# AAM-004 — Internal tester feedback capture

## Problem

Internal testers need a low-friction way to report bugs, questions, and ideas from the page where they encounter them. Tomorrow's test must accept either typed feedback or a short voice recording and give the Aamish team one place to review submissions.

## Acceptance criteria

- Every authenticated role can open a persistent feedback control without obscuring core navigation.
- A tester can submit text, a voice recording, or both.
- Voice recording is limited to two minutes and 10 MB before upload.
- Audio is stored in the configured Cloudinary account; feedback metadata and text are stored in Neon.
- Each submission records the tester, role, enterprise when applicable, source page, category, and timestamp.
- Only a super admin can list feedback in the Aamish feedback inbox.
- Successful and failed submissions emit structured logs with a request ID and no feedback body.
- Desktop and 390 px layouts remain usable without horizontal overflow.

## Out of scope

- AI responses, transcription, sentiment analysis, autonomous actions, or GitHub issue creation.
- Anonymous/public feedback.
- Feedback status changes, assignment, deletion, or audio retention automation.

## Validation

- `bun test`
- `bun run lint`
- `bun run build`
- Authenticated text and voice submission against the Docker application
- Super-admin inbox authorization and rendering
- Desktop and 390 px responsive browser inspection
