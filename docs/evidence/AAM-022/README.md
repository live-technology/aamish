# AAM-022 service calendar evidence

Captured from the local internal-beta application on 2026-09-01.

- `desktop-prerequisite.png`: desktop calendar with shared shell and direct menu-setup recovery.
- `mobile-service-details.png`: first publish step with required service details and employee impact.
- `mobile-publish-review.png`: final review of organization, Dhaka cutoff, reservation impact, and menu options.
- `mobile-published-service.png`: published-service confirmation and date-oriented upcoming timeline at 390 × 844.

Validated behavior:

- only active organizations and active menus are offered;
- missing setup is explained before the publish flow opens and links to the relevant task;
- the three-step journey validates service details and prevents empty or duplicate menu options;
- the review step shows the number of affected active employees before publishing;
- publication creates the schedule, labeled menu options, and default employee reservations atomically;
- a successful publish refreshes the timeline and confirms the organization and service date;
- an Enterprise Admin receives `403 FORBIDDEN` with a request ID from the Super Admin schedule API;
- the structured `schedule.published` log includes request ID, actor, schedule, option count, organization, and date;
- the exact disposable menu and schedule were removed after validation.

No schema migration or environment-variable change is required.
