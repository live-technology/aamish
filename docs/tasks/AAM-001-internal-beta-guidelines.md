# AAM-001 — Document internal beta and contribution workflow

## Problem

The repository needs an explicit statement that Aamish is a vibe-coded internal-testing beta and is not production-ready. Contributors also need a mandatory branch, commit, task, and pull-request workflow before collaborative development begins.

## Acceptance criteria

- The root README prominently identifies the product as an internal beta that is not ready for production.
- The README explains current scope, local setup, validation, protected Vercel testing, and production-readiness gaps.
- A root `AGENTS.md` defines `dev` as the integration branch and `main` as the internal release branch.
- Working branches originate from `dev` and merge through task-linked pull requests into `dev`.
- Releases merge from `dev` to `main` through a separate pull request.
- Every commit represents one coherent unit of work.
- Every pull request contains one tracked task, validation evidence, and relevant migration or environment notes.
- App-specific agent instructions inherit the root rules.

## Out of scope

- Changing application behavior or UI.
- Deploying to Vercel.
- Adding production monitoring or security controls.
- Declaring Aamish production-ready.

## Validation

- Run `git diff --check`.
- Review Markdown rendering and internal links.
- Confirm no application source, migrations, or environment values changed.
