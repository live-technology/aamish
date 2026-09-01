# Antigravity QA task queue

This queue makes exploratory QA asynchronous and prevents the primary coding loop from repeatedly exercising the same journey.

## Workflow

1. The implementation task adds one bounded assignment under `.agents/tasks/`.
2. The assignment names one persona, one environment, one journey, mutation authority, viewports, and one report path.
3. Antigravity runs the assignment once at low effort and writes structured JSON under `docs/evidence/<TASK-ID>/`.
4. Reports and screenshots accumulate for the separate visual-QA phase. The primary coding session does not review or rerun them while implementation is in progress.
5. Deterministic unit, lint, build, authorization, and data-safety checks remain local gates. Antigravity supplies independent exploratory, responsive, and accessibility evidence; it does not approve or merge pull requests.
6. The integrated three-role regression runs once at the release boundary instead of after every page task.

## Current queue

| Task | Persona | Assignment | Expected report | Status |
| --- | --- | --- | --- | --- |
| AAM-023 | `aamish-super-admin-tester` | `.agents/tasks/AAM-023-fulfillment-qa.md` | `docs/evidence/AAM-023/antigravity/report.json` | Ready for user-run session |
| AAM-024 | `aamish-super-admin-tester` | `.agents/tasks/AAM-024-quality-feedback-qa.md` | `docs/evidence/AAM-024/antigravity/report.json` | Ready for user-run session |
| AAM-025 | `aamish-enterprise-admin-tester` | `.agents/tasks/AAM-025-enterprise-meals-qa.md` | `docs/evidence/AAM-025/antigravity/report.json` | Ready for user-run session |

## Token discipline

- One Antigravity run per assignment unless the report identifies a specific retryable infrastructure failure.
- Use `--effort low` for deterministic journey checks and `--effort medium` only for ambiguous UX review.
- Never ask the agent to reread the whole repository, redesign the feature, or test unrelated routes.
- Record the returned input, output, thinking, and total token usage beside the report.
- Do not ask the primary coding session to inspect screenshots or reports until the dedicated visual-QA phase.

## Run record

| Task | Mode | Result | Gemini usage | Next action |
| --- | --- | --- | ---: | --- |
| AAM-023 | Headless, low effort | No report; `read_url` was auto-denied because headless mode cannot prompt | 44,502 total tokens | Do not retry headlessly. Open the assignment interactively in Antigravity, or add only a repository-scoped localhost `read_url` allow-rule after explicit approval. |
