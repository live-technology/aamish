# Aamish engineering rules

These instructions apply to every human or automated contributor in this repository. More specific instructions inside a subdirectory may add constraints but must not weaken these rules.

## Product status

Aamish is a **vibe-coded beta for internal testing only**. It is **not production-ready**. Do not describe it as production-ready, enable public access, use production customer data, or silently expand the beta into live operations.

Prefer simple, inspectable implementations. Preserve structured logs and request IDs so failures can be debugged from Vercel or Docker logs. Never commit secrets, `.env` files, credentials, personal data, database exports, or uploaded review media.

## Mandatory branch flow

The permanent branches are:

- `main` — stable internal release candidates only.
- `dev` — integration branch for completed beta work.

Every normal change must use this flow:

```text
main
  └── dev
        └── feat/TASK-ID-short-description
              └── pull request into dev

dev
  └── release pull request into main
```

Rules:

1. Update local `dev` before starting work.
2. Create the working branch from `dev`, never from `main`.
3. Use a descriptive branch name such as `feat/AAM-123-menu-options`, `fix/AAM-204-package-image`, `docs/AAM-310-beta-readme`, or `chore/AAM-402-dependencies`.
4. Never commit directly to `dev` or `main`.
5. Open the feature or fix pull request into `dev`.
6. Merge `dev` into `main` only through a separate release pull request after the integrated build and internal journey checks pass.
7. Do not open feature branches directly against `main` and do not merge `main` changes without bringing them back into `dev`.

## Branch ownership and merge authority

The expected ownership split is:

- Automated contributors own task branches and may merge a reviewed task PR into `dev` only after every required check passes and the GitHub identity performing the merge has explicit PR write permission.
- The human repository owner owns releases and manually merges the release PR from `dev` into `main`.
- Automated contributors must never merge into `main`, trigger a production release from another branch, or bypass the release owner.
- Nobody may work around missing PR permissions by pushing a task branch directly to `dev` or `main`.

When GitHub permissions prevent an automated contributor from opening or merging a PR, the contributor must push only the task branch, provide the compare/PR URL, report the missing permission, and stop before changing a permanent branch. The required GitHub App permissions are repository access plus **Contents: read and write** and **Pull requests: read and write**.

Recommended branch protection:

- `dev`: require a pull request, require repository checks, block force pushes and direct pushes, and permit the approved automated contributor identity to merge reviewed PRs.
- `main`: require a pull request and repository checks, block force pushes and direct pushes, and reserve release approval and merge authority for the human repository owner.

Use **Create a merge commit** for the `dev` to `main` release PR. That merge commit makes `main` appear one commit ahead of `dev`, which is expected. Immediately after the release, an automated contributor must open a no-feature sync PR from `main` back into `dev` under the same release task. Merge that sync PR before creating another task branch so both permanent branches share the release commit and the network graph remains understandable.

## Task requirement

Every pull request must represent exactly one tracked task. The PR must include the task ID and a link to the issue, ticket, or written task description. If no task exists, create one before opening the PR.

The task must state:

- the problem or user journey being addressed;
- clear acceptance criteria;
- what is explicitly out of scope;
- required validation or evidence.

Do not combine unrelated cleanup, redesigns, dependency upgrades, and feature work into one task or PR.

## Commit rules

Every commit must be one basic, coherent unit of work that can be understood and reviewed independently.

- Use an imperative Conventional Commit message, for example `fix: contain package images within cards`.
- Keep formatting-only changes separate from behavior changes.
- Keep schema migrations with the code that requires them, but do not mix unrelated migrations.
- Do not use vague messages such as `updates`, `fix stuff`, `wip`, or `changes`.
- Do not commit broken builds, debugging artifacts, generated secrets, or commented-out experiments.
- Rebase or clean up fixup commits before the PR is merged.

## Pull request rules

Every PR into `dev` must contain:

- task ID and task link;
- concise problem statement;
- summary of the implemented change;
- acceptance-criteria checklist;
- validation commands and results;
- manual validation steps for the relevant user role;
- screenshots for visible UI changes;
- database-migration and environment-variable notes;
- known limitations or follow-up tasks.

Recommended PR title format:

```text
[AAM-123] Add multiple employee meal options
```

A PR is not ready to merge when it has unrelated changes, missing task context, failing checks, undocumented migrations, visible layout regressions, or unresolved review comments.

An automated contributor may merge a PR into `dev` only when:

- the branch started from the current `dev`;
- the PR contains exactly one tracked task;
- all required automated and manual validation is documented and passing;
- visible changes include responsive evidence;
- migrations and environment changes are explicit;
- review comments are resolved; and
- the contributor has verified the PR targets `dev`, never `main`.

Delete the task branch after a successful merge. Do not delete `dev` or `main`.

## Required checks

At minimum, run from `apps/web`:

```bash
bun test
bun run lint
bun run build
```

Also validate the affected journey in the running Docker application. UI changes must be inspected at desktop and narrow/mobile widths. Database changes must be tested against an isolated database or Neon branch and include an ordered migration.

Before a `dev` to `main` release PR, validate the full Aamish administrator → enterprise administrator → employee journey and check server logs for unexpected errors.

## Review priorities

Review in this order:

1. data safety, authentication, and authorization;
2. correctness of the three user journeys;
3. schema and migration safety;
4. debuggability and structured logging;
5. responsive layout and accessibility;
6. maintainability and scope discipline.

Because this is a beta, limitations may be accepted for internal testing only when they are explicit in the PR and captured as follow-up tasks.

## Repository hygiene and instruction maintenance

- Keep the root `AGENTS.md` authoritative for repository-wide workflow, safety, and release rules.
- Put framework- or directory-specific additions in the nearest nested `AGENTS.md`; nested rules may add constraints but may not weaken root rules.
- Update `AGENTS.md` in a dedicated documentation task whenever branch ownership, required checks, release authority, or contributor permissions change.
- Update `README.md` for operator-facing commands and setup. Keep implementation details and acceptance evidence in the tracked task or PR instead of expanding `AGENTS.md` into a changelog.
- Never commit `.vercel/`, `.env*`, local recordings, generated logs, database exports, or temporary debugging artifacts.
- Before committing, inspect `git status`, stage explicit paths, and confirm unrelated user changes remain untouched.
