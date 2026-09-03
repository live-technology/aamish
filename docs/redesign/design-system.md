# Aamish design-system contract

Status: proposed foundation  
Task: [AAM-017](https://github.com/live-technology/aamish/issues/32)

## Experience direction: calm food operations

Aamish should feel operationally trustworthy without resembling generic accounting software. The visual system combines disciplined enterprise structure with restrained warmth from the food brand.

- Calm: generous hierarchy, quiet surfaces, limited accent use.
- Operational: dates, status, quantity, location, and next action are immediately scannable.
- Human: food imagery and plain language appear where they aid a meal decision.
- Honest: beta limitations, empty data, pending work, and failures are explicit.

## Foundations

### Color roles

The current green, orange, cream, and white direction may remain, but raw colors must be replaced by semantic tokens:

```text
surface.canvas         application background
surface.default        primary cards and panels
surface.subtle         grouped or secondary content
text.primary           headings and important values
text.secondary         supporting copy
text.muted             metadata only
border.default         normal separation
action.primary         primary button and selected navigation
action.primary-hover   hover/pressed state
accent.food            restrained culinary emphasis
status.success         confirmed/safe/on
status.warning         attention/cutoff approaching
status.danger          failure/critical quality issue
status.info            neutral progress/context
focus.ring             consistent keyboard focus
```

No status may rely on color alone. All status combinations must meet WCAG 2.2 AA contrast.

### Typography

- Use one highly legible sans-serif family for interface text and tabular data.
- A restrained brand/display face may be used only for top-level page titles and marketing moments.
- Minimum default body size: 14 px desktop, 15–16 px employee mobile.
- Avoid the current 8–10 px metadata pattern for essential information.
- Use tabular numerals for counts, dates, prices, and CSAT.

### Spacing and sizing

- Base spacing unit: 4 px.
- Primary scale: 4, 8, 12, 16, 24, 32, 48, 64.
- Interactive controls: 40 px minimum desktop; 44 px minimum touch target.
- Content widths: 720 px forms, 1120–1280 px operational data, 640 px employee task column.
- Radius scale: 8 px controls, 12 px cards, 16 px prominent surfaces. Pill shapes are reserved for compact statuses.

### Responsive breakpoints

Components respond to available space rather than simply hiding content:

- compact: below 600 px;
- medium: 600–959 px;
- wide: 960 px and above.

Tables become labeled record cards or controlled horizontal data regions on compact screens. Critical context must not disappear through `nth-child` hiding.

## Core component inventory

Only these shared primitives may establish base visual behavior:

- `AppShell`, `SideNavigation`, `MobileNavigation`, `PageHeader`;
- `Button`, `IconButton`, `LinkButton`;
- `TextField`, `SelectField`, `TextArea`, `FileUpload`, `DateTimeField`;
- `FormSection`, `FieldError`, `FormActions`;
- `Card`, `MetricCard`, `StatusBadge`, `Alert`, `Toast`;
- `DataTable`, `RecordList`, `FilterBar`, `Pagination`;
- `EmptyState`, `LoadingState`, `ErrorState`;
- `Drawer`, `Dialog`, `Stepper`, `ConfirmDialog`;
- `MealCard`, `MealOption`, `CutoffStatus`;
- `RatingInput`, `MediaPreview`, `AudioPlayer`.

Feature components compose these primitives. They may not redefine buttons, fields, focus rings, badges, or spacing globally.

## Interaction rules

- Buttons use verbs: “Create enterprise”, “Publish service”, “Save triage”.
- One primary button per task region.
- Disabled controls explain why through nearby text; tooltips are insufficient on mobile.
- Destructive actions require clear object naming and confirmation.
- Save buttons show progress and prevent duplicate submission.
- Success messages confirm the object and next state; they do not disappear before the user can read them.
- Validation appears beside the field and a summary focuses the first invalid field for long forms.
- Drawers are for short contextual tasks. Multi-step or high-consequence workflows use dedicated pages or dialogs with steps.
- Dates and cutoffs display the `Asia/Dhaka` timezone wherever ambiguity is possible.

## Accessibility contract

- Semantic landmarks and one `h1` per page.
- Visible `:focus-visible` ring on every interactive element.
- Full keyboard operation with logical focus order and focus return after dialogs.
- Form fields have programmatic labels, descriptions, and errors.
- Dialogs have accessible names, focus containment, Escape behavior, and background inertness.
- Status messages use appropriate live regions without announcing every keystroke.
- Images have meaningful alt text or empty alt when decorative.
- Charts expose equivalent values and selection through text/controls.
- Motion respects `prefers-reduced-motion`.

## Content language

- Use “Aamish administrator”, “enterprise administrator”, and “employee” consistently.
- Prefer “organization” only in navigation when referring to client companies collectively; record labels may use “Enterprise”.
- Use “meal service” for a scheduled date/options/cutoff unit.
- Use “receiving meal” and “skipping meal”, not ambiguous ON/OFF alone.
- Use “Package” for a reusable menu definition and “Option” for its scheduled employee choice.
- Never expose raw API error codes. Preserve the request ID for support.

## Design-system verification

The implementation foundation is not complete until it has:

- a token source with semantic names and no duplicated raw values in features;
- a development-only component reference route or equivalent visual harness;
- automated accessibility checks for primitives;
- screenshot baselines for wide and compact states;
- long Bangla/English copy, empty, error, disabled, loading, and overflow fixtures;
- documentation for intended use and prohibited variants.

