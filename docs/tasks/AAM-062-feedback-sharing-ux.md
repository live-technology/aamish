# AAM-062 — Make guest feedback sharing clear

Problem: the admin workflow required a separate View feedback click, showed a relative URL, and crowded copy/open/status controls. The guest form used text instead of the Aamish logo.

Acceptance:
- Enterprise selection immediately filters feedback and exposes the correct link, resetting pagination.
- One compact sharing panel displays the full current-domain URL; clear Copy link/Open form actions and stable inline copied state.
- Enterprise admins retain their own enterprise link without a selector.
- Guest form uses the existing Aamish logo with correct aspect ratio and accessible text.
- Desktop/mobile checks, copy contents, enterprise switching, logo loading, required checks and dev deployment pass.

Out of scope: changes to submission/API/auth/database/media behavior, QR generation, main release, unrelated styling.
Validation: bun test, bun run lint, bun run build; Docker browser checks at desktop and narrow widths; hosted dev verification. No migration or environment changes.
