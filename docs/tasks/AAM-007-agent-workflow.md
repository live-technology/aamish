# AAM-007 — Define agent merge ownership and release control

## Problem

The repository describes the branch flow but does not explicitly assign merge authority, explain how an automated contributor should behave when GitHub PR permissions are missing, or define how `dev` is synchronized after a release merge into `main`.

## Acceptance criteria

- `AGENTS.md` assigns task-branch and `dev` PR ownership to approved automated contributors.
- Only the human repository owner may merge `dev` into `main`.
- Direct pushes to permanent branches remain prohibited even when PR tooling is unavailable.
- Required GitHub App permissions and branch protections are documented.
- The post-release `main` to `dev` synchronization procedure is explicit.
- `bun test`, lint, and build are required before merging into `dev`.
- Repository-instruction maintenance and local-artifact hygiene are documented.

## Out of scope

- Changing GitHub organization or repository settings.
- Granting credentials or application permissions.
- Modifying application code, database schema, or deployments.
- Merging any currently open feature or fix branch.

## Validation

- Review the rendered Markdown and branch diagram for clarity.
- Confirm the workflow remains task branch → PR into `dev` → release PR into `main` → sync `main` back into `dev`.
- Confirm no application, migration, secret, or environment file changed.
