# AAM-067 — Replace the default favicon

Request: use the existing Aamish logo in browser tabs instead of the framework default.

Acceptance: replace favicon.ico with Aamish at 16/32/48/64/256px; add the matching icon.png so Next emits a new versioned browser-icon URL. Preserve the original logo and application behavior.

Out of scope: logo redesign, other branding, database or environment changes.

Validation: test/lint/build once and a focused Docker check that page metadata references the Aamish icon and both icon URLs serve the intended files. Inspect the square icon asset. No migration or new dependencies.

Results: 136 tests pass; lint/build pass. Docker desktop/mobile metadata points to the new versioned icon.png, and both PNG/ICO responses exactly match the branded source files. Square icon visually inspected. The icon asset itself is the visual evidence; no page layout changes.
