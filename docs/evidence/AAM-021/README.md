# AAM-021 menu library evidence

Captured from the local internal-beta application on 2026-09-01.

- `desktop-empty.png`: empty menu-library state at desktop width.
- `desktop-create.png`: accessible create dialog with required fields identified before submission.
- `desktop-edit.png`: edit dialog retaining the current image unless a replacement is selected.
- `desktop-loaded.png`: searchable menu library with a contained 16:9 image and operational totals.
- `mobile-create.png`: responsive create dialog at 390 × 844 with visible 44 px actions.
- `mobile-loaded.png`: responsive loaded menu library at 390 × 844 without horizontal overflow.

Validated behavior:

- `/admin/menus` is the canonical route and `/admin/packages` redirects to it;
- Super Admin can create and edit a menu through the signed Cloudinary upload flow;
- title, category, description, non-negative price, status, and the initial image are required;
- edit keeps the existing image when no replacement is selected;
- menu images use a consistent contained 16:9 presentation on desktop and mobile;
- upload signatures are role-scoped and return request IDs for failures;
- Enterprise Admin cannot access the Super Admin menu API;
- the disposable menu record and Cloudinary test asset were removed after validation.

Local operator note: the repository `.env` was not changed. Its combined
`CLOUDINARY_URL` is malformed locally, so the Docker validation used an in-memory,
URL-encoded value derived from the existing legacy Cloudinary variables. Correct
the combined value in each deployment environment before relying on uploads.
