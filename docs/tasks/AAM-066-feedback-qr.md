# AAM-066 — Download a branded enterprise feedback QR

## Journey
An Aamish or enterprise administrator needs a ready-to-print feedback QR from the existing enterprise sharing panel.

## Acceptance
- Download QR opens an accessible preview for the selected active enterprise.
- Export a 1800×2400 PNG with the unchanged Aamish logo centered inside a scannable QR, enterprise name, “Tell us how we did, we’re listening” and “Please scan the QR to submit your feedback.”
- Encode exactly the current enterprise feedback link; preserve the original URL and existing access controls.
- Generate locally in the browser; handle generation errors and allow closing/retrying.
- Responsive preview and a working PNG download for both administrator roles.

## Out of scope
QR tracking, custom domains, changing existing feedback links, public access changes, database changes, PDF generation.

## Validation
Required tests/lint/build once; focused Docker administrator preview/download checks at desktop/mobile sizes. Decode the exported logo-overlaid QR and compare with the displayed URL. Inspect the exported poster. No migration or environment changes. Adds the qrcode encoder and its TypeScript types; no external QR service.

## Manual
Open Guest feedback, select an active enterprise if applicable, choose Download QR, inspect the preview and destination, then Download PNG. Scan the image to open the same feedback form. Generate printed event materials from the intended permanent host.

## Evidence
- 136 existing tests pass; lint and optimized build pass.
- Docker: both administrator roles can preview and download; inspected at 1440px and 390px. Escape closes and restores focus. Logo-load failure shows retry and disables export until ready.
- Independent QR decoder reads the exported PNG back to the exact displayed URL. Permanent-host and dev-host URL lengths also decode at full and half resolution with the central logo intact.
- No unexpected application errors. [Poster and responsive screenshots](../evidence/AAM-066/).
- Limitation: this exports PNG only; final printed size/quality depends on the printer settings. Existing host and enterprise availability still govern the destination.
