# Lean redesign delivery and validation system

Status: proposed working agreement  
Task: [AAM-017](https://github.com/live-technology/aamish/issues/32)

## Why the previous loop was slow

The previous process alternated directly between chat, implementation, screenshots, and reactive fixes. It lacked approved journey specs, reusable visual primitives, stable fixtures, and automated visual evidence. The result was high context reconstruction cost and repeated manual verification of low-risk changes.

## New unit of work

One redesign ticket owns one complete journey or one design-system concern. Its task file contains:

```text
Problem and user role
Current capability to preserve
Target task flow
States and edge cases
Responsive behavior
Accessibility requirements
Explicitly unsupported behavior
Acceptance evidence
```

Implementation starts only after this compact contract exists.

## Risk-based validation

| Change risk | During implementation | Before PR merge |
| --- | --- | --- |
| Token/copy/spacing | targeted component test | lint + relevant screenshot |
| Shared primitive | unit/a11y tests | full component visual matrix + build |
| Feature layout | relevant unit tests | desktop/390 px screenshots + build |
| Mutation or authorization | API/unit tests | Docker role journey + logs + build |
| Schema/business rule | isolated migration and tests | full affected role journey + logs + build |

The complete test suite and three-role browser regression run once per integration batch, not after every harmless CSS adjustment.

## Required automation

Follow-up engineering must add stable scripts for:

- isolated beta fixture reset and seeding for all three roles;
- one-command unit, lint, and build checks;
- browser journey tests for primary role flows;
- visual screenshots at 390, 768, and 1280 px;
- accessibility scanning of primary pages and the component harness;
- structured log extraction by request ID;
- migration status inspection.

Scripts must avoid production data and redact credentials and personal content.

## Review sequence

1. Journey contract review: flow, states, preserved capability.
2. Design review: reference screen and component usage.
3. Implementation review: code, accessibility, authorization.
4. Evidence review: automated results and responsive screenshots.
5. Merge task PR into `dev` after checks.
6. At release boundary, run the integrated three-role regression and open `dev` → `main` for the human owner.

## Phased backlog

| Task | Scope | Depends on |
| --- | --- | --- |
| AAM-018 | Semantic tokens, primitives, component harness, shared responsive shell | AAM-017 approval |
| AAM-019 | Login and session-expiry experience | AAM-018 |
| AAM-020 | Super-admin overview and enterprise onboarding redesign | AAM-018 |
| AAM-021 | Package-library redesign | AAM-018 |
| AAM-022 | Service-calendar and publish-flow redesign | AAM-020, AAM-021 |
| AAM-023 | Fulfillment dashboard redesign | AAM-022 |
| AAM-024 | Quality and product-feedback redesign | AAM-018 |
| AAM-025 | Enterprise overview and meals redesign with stable routes | AAM-018, AAM-022 |
| AAM-026 | Enterprise people and import redesign | AAM-018, AAM-020 |
| AAM-027 | Enterprise reviews redesign | AAM-018, AAM-024 |
| AAM-028 | Employee today, schedule, and review redesign | AAM-018, AAM-022 |
| AAM-029 | Fixture, browser-journey, visual-regression, and accessibility gates | Begins with AAM-018; completes after AAM-028 |

## Scope control

- Missing PRD capabilities identified in the audit are not automatically redesign work.
- Each capability addition gets a separate product task and acceptance criteria.
- No ticket may combine design-system foundation, unrelated feature work, and database changes.
- Visual polish is not accepted when the target journey remains unclear or inaccessible.
- A new variant must prove that an existing primitive cannot express the requirement.

## Definition of redesign done

The goal is complete only when every implemented capability in the audit has moved to the approved information architecture and design system, primary journeys pass automated and human-readable evidence, and no old page-specific shell or visual primitive remains in active routes.

