# Aamish task-oriented information architecture

Status: proposed for approval  
Task: [AAM-017](https://github.com/live-technology/aamish/issues/32)

## Product-wide navigation rules

- Navigation names the user's task, not the underlying table or implementation.
- A section has a stable URL. Client-only tab state is not navigation.
- The first page after login answers: “What needs my attention now?”
- Primary actions appear in the page header; secondary actions live near their relevant content.
- Desktop uses a persistent side rail. Mobile uses a compact header plus role-appropriate bottom or horizontal navigation.
- Feedback remains globally reachable but visually secondary to the current task.

## Aamish super administrator

| Navigation | URL | User question | Existing capabilities composed here |
| --- | --- | --- | --- |
| Overview | `/admin` | What needs attention today? | Enterprise/package/schedule readiness, today's counts, open quality/feedback totals |
| Organizations | `/admin/organizations` | Who do we serve and how are they configured? | Existing enterprise list and onboarding |
| Menus | `/admin/menus` | What packages can be scheduled? | Package create/edit/status/image |
| Service calendar | `/admin/calendar` | What will each enterprise receive and when? | Schedule create/list, options, cutoff |
| Fulfillment | `/admin/fulfillment` | What must the kitchen prepare and send? | Operations aggregation |
| Quality | `/admin/quality` | What food issues and satisfaction changes need action? | CSAT and food-quality triage |
| Product feedback | `/admin/feedback` | What are testers reporting about the platform? | Feedback inbox/transcripts/status |

The first implementation may preserve old URLs through redirects. Links and tests should converge on the new names.

### Super-admin service lifecycle

```text
Organization ready
  → menu package ready
  → service scheduled and published
  → employee choices open
  → cutoff locks
  → fulfillment count becomes operational
  → meal delivered
  → reviews and quality reports arrive
  → human triage closes the loop
```

Every overview card should take the operator to one stage of this lifecycle with filters already applied.

### Enterprise onboarding redesign

```text
1 Company
  Name → slug generated silently; contact details
2 Locations
  One required location → add as many as needed
3 Administrator
  Name → username suggested and editable → temporary password
4 Review
  Company + locations + admin → create atomically → credential handoff
```

Errors stay within their step. Navigating backward preserves entered data. Unsupported editing/deletion is not suggested after creation.

### Menu publishing redesign

```text
Choose enterprise and service date
  → choose one or more active packages
  → label/preview employee options
  → set cutoff with Dhaka date/time context
  → review affected employee count
  → publish
```

The interface explains missing prerequisites before opening the workflow and links directly to the missing setup task.

## Enterprise administrator

| Navigation | URL | User question | Existing capabilities composed here |
| --- | --- | --- | --- |
| Overview | `/enterprise` | What is happening with our meals today? | Today's/upcoming counts, employee total, recent CSAT |
| Meals | `/enterprise/meals` | What is scheduled and how many meals reach each location? | 14-day date/location/option counts |
| People | `/enterprise/people` | Who receives meals and where? | Roster, single create, CSV import |
| Reviews | `/enterprise/reviews` | What are employees saying about our meals? | 30-day enterprise-scoped reviews |

### People workflow

- Roster opens with search, location filter, and clear count.
- “Add employee” and “Import CSV” are separate actions with separate feedback.
- Single create groups identity, delivery assignment, and access credentials.
- Import is a guided three-step flow: download template, upload, review results.
- Existing limitations—no editing/deactivation UI and simple CSV parsing—remain explicit until follow-up product tasks implement them.

## Employee

Employee access is mobile-first and date-oriented.

| Navigation | URL | User question | Existing capabilities composed here |
| --- | --- | --- | --- |
| Today | `/employee` | What meal am I receiving and can I change it? | Current meal options, reserve/skip, cutoff |
| Schedule | `/employee/schedule` | What meals are coming next? | Existing queried upcoming schedules, presented explicitly |
| Reviews | `/employee/reviews` | Which received meal can I review? | Seven-day eligible review and update behavior |

### Today flow

```text
Today's service status
  → package options with image and contents
  → selected option
  → receiving / skipping state
  → cutoff status and consequence
  → immediate confirmation beside the action
```

The reserve/skip control must use explicit language in addition to color and switch position. After cutoff, the interface explains that kitchen preparation is locked rather than merely disabling a control.

### Review flow

```text
Choose an eligible received meal
  → rate 1–5
  → optional written detail
  → optional photos, visible previews and limits
  → submit/update
  → durable success confirmation
```

The redesign may expose all eligible schedules already returned by the page query, but eligibility remains server-authoritative.

## Page contract

Every authenticated page follows the same hierarchy:

1. role-aware application shell;
2. breadcrumb only when hierarchy exceeds one level;
3. page title and one-sentence task description;
4. one primary action when relevant;
5. attention/status summary;
6. primary task content;
7. empty/loading/error states occupying the same content region;
8. contextual help or beta feedback, never competing with the primary action.

## State contract

Every data surface must deliberately design:

- initial loading;
- loaded with data;
- loaded empty;
- inline validation failure;
- server/network failure with request ID and retry;
- mutation in progress;
- mutation success;
- partial success where bulk operations allow it;
- unauthorized/expired session;
- narrow viewport and long-content behavior.

