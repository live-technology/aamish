# Antigravity visual and image QA plan

Use this plan from a separate Antigravity session. It supplies independent visual evidence for Aamish redesign tasks without making the implementation loop repeat every journey.

## Operating contract

- Read the task assignment under `.agents/tasks/` and use its named persona.
- Test only local Docker/local development or an explicitly supplied disposable Vercel preview.
- Use an already authenticated disposable account for the named role. Do not discover or save credentials.
- Never inspect `.env*`, `.vercel`, cookies, uploaded customer media, database exports, or production data.
- Do not edit application data unless the task assignment explicitly authorizes a disposable mutation.
- Do not edit source files, commit, push, open PRs, or merge branches.
- One run per task. If the browser, authentication, fixture, or permission is missing, report one blocker and stop.

## Required viewports

Capture the same state at these exact CSS viewport sizes:

| Target | Viewport | Purpose |
| --- | ---: | --- |
| Desktop | 1280 × 900 | Full side rail, page hierarchy, dense operational content |
| Mobile | 390 × 844 | Bottom navigation, one-handed actions, form/card transformation |
| Tablet, only when assigned | 768 × 1024 | Enterprise tables/import and intermediate wrapping |

Do not use browser zoom as a substitute for viewport emulation.

## Screenshot set

For every assigned route, save only the states that exist in that task:

```text
docs/evidence/<TASK-ID>/antigravity/
  desktop-loaded.png
  desktop-empty.png
  desktop-dialog-or-detail.png
  mobile-loaded.png
  mobile-empty.png
  mobile-dialog-or-detail.png
  report.json
```

Use full-page screenshots for page structure. Add a tightly cropped screenshot only when a defect is not legible in the full-page image. Never capture passwords, tokens, personal recordings, customer photos, or real personal information.

## Visual inspection checklist

### Shell and navigation

- Aamish logo keeps its aspect ratio and is not stretched, cropped, or blurred.
- Desktop side rail has one clear current item; content does not slide beneath it.
- Mobile header and bottom navigation do not cover primary actions, final cards, toast messages, feedback trigger, or modal footer.
- The final page content can scroll completely above fixed navigation.
- Navigation labels do not truncate into ambiguous words at 390 px.

### Hierarchy and readability

- Page title, one-sentence purpose, primary action, summary, filters, and main content read in that order.
- Heading levels and visual sizes match their hierarchy.
- Body text remains readable without zoom; muted copy still has sufficient contrast.
- Long organization, location, person, menu, transcript, and feedback strings wrap without widening the page.
- Numbers, currency, dates, times, status badges, and option labels remain visually associated with the correct record.

### Images and media

- Menu and meal images remain inside their card or preview boundary at both viewports.
- The intended aspect ratio remains stable while loading and after load; no layout jump pushes actions away.
- `object-fit` behavior does not stretch images. Important food content is not unintentionally clipped.
- Missing images render the designed placeholder rather than a broken-image icon or collapsed region.
- Image preview, replacement, and current-image states are visually distinguishable.
- File names, upload controls, and previews do not overflow dialogs on mobile.
- Audio controls stay within their card, remain operable, and do not force horizontal scrolling.
- Pending transcription is visibly different from an empty or failed transcript.
- Never judge the food itself; report only platform presentation and interaction defects.

### Cards, tables, charts, and timelines

- Card borders, radii, spacing, and background levels use one coherent system.
- Dense desktop tables/cards transform into readable mobile units without losing field labels.
- Charts retain labels and selected state; bars do not overlap values or dates.
- Timeline dates, organization/location, status, and content cannot be mistaken for adjacent records.
- Empty and filtered-empty states occupy the content region and explain the next action.

### Forms, dialogs, and actions

- Required fields are identified before submission and the marker stays beside its label.
- Dialog header and footer remain visible/reachable; body scroll does not hide Cancel or Save.
- No dialog, drawer, select, file control, or textarea exceeds 390 px.
- Interactive targets are at least 44 × 44 CSS px, including icon-only actions.
- Focus is visible and follows the visual order. Escape/close/cancel behavior is understandable.
- Loading, success, validation, and server failure do not shift or cover the action being explained.
- Failure copy includes a request ID when the server supplies one.

### Overflow and overlap measurements

Record these values for each viewport:

```json
{
  "viewport_width": 390,
  "body_scroll_width": 390,
  "document_scroll_width": 390,
  "horizontal_overflow": false,
  "covered_primary_actions": [],
  "undersized_targets": []
}
```

Flag horizontal overflow when body or document scroll width exceeds viewport width by more than 1 px. For fixed navigation, compare bounding rectangles at the initial position and after scrolling to the end.

## Report rules

- Return the structured JSON format in `docs/testing/antigravity-personas.md`.
- Put screenshot paths in each relevant step or issue.
- `PASS` requires both target viewports and every task-specific assertion.
- Use `PASS_WITH_ISSUES` when the journey completes but has P2/P3 defects.
- Use `FAIL` for P0/P1 failures.
- Use `BLOCKED_FIXTURE` only when the named session, fixture, route, or permission is unavailable.
- Do not propose a redesign in the report. State expected behavior, observed behavior, reproduction, viewport, and evidence.
