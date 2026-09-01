# Antigravity testing personas

Status: internal beta testing workflow
Task: [AAM-030](https://github.com/live-technology/aamish/issues/37)

These repository-scoped Gemini personas reduce repeated manual QA while keeping implementation, security review, commits, and releases under the primary contributor workflow. Agent judgment supplements deterministic tests; it never replaces them.

## Personas

| Agent | Primary perspective | Default viewports |
| --- | --- | --- |
| `aamish-super-admin-tester` | Aamish operations and quality owner | 1280, 390 |
| `aamish-enterprise-admin-tester` | Company meal coordinator | 1280, 768, 390 |
| `aamish-employee-tester` | Time-constrained mobile employee | 390, 768 |

Definitions live under `.agents/agents/<name>/agent.md` and are discovered by Antigravity from this workspace.

## Safety contract

- Use only local Docker or an explicitly named disposable Vercel preview backed by isolated beta fixtures.
- Never target `aamish.vercel.app`, production data, or customer accounts.
- Do not read or transmit `.env*`, `.vercel`, credentials, uploaded recordings/photos, database exports, cookies, or personal data.
- Prefer an already authenticated disposable browser session. Do not discover credentials from the repository or system keychain.
- Default to read-only observation. A prompt must explicitly authorize fixture creation or preference/review mutations in a named disposable environment.
- Never delete records, alter schemas, edit repository files, run migrations, commit, push, manage issues/PRs, or touch permanent branches.
- Stop and report when the requested environment, authorization, or fixture is missing.

## Assignment format

Keep one run bounded to one role, one environment, and one journey. Example:

```text
Use the aamish-employee-tester persona.
Environment: local Docker at http://localhost:3002 with disposable QA fixtures.
Authorization: observation plus meal-preference changes for the supplied QA employee.
Journey: Today → select option → skip → reserve → review eligibility.
Evidence directory: docs/evidence/AAM-XXX/employee.
Do not inspect repository secrets or make source-control changes.
```

Do not include credentials in a saved prompt or committed artifact. Establish the disposable authenticated session separately.

## Required result

Return one JSON object and no prose:

```json
{
  "persona": "aamish-employee-tester",
  "environment": "local Docker",
  "journey": "Today meal choice",
  "status": "PASS_WITH_ISSUES",
  "steps": [
    {
      "action": "Open Today",
      "expected": "Current meal and cutoff are clear",
      "observed": "Current meal is visible",
      "result": "PASS"
    }
  ],
  "issues": [
    {
      "severity": "P2",
      "title": "Specific user-visible defect",
      "expected": "Expected behavior",
      "observed": "Observed behavior",
      "reproduction": ["Step 1", "Step 2"],
      "viewport": "390x844",
      "request_id": null,
      "evidence": null
    }
  ],
  "console_errors": [],
  "server_log_errors": [],
  "followups": []
}
```

Severity uses `P0` data/security failure, `P1` blocked primary journey, `P2` material usability/correctness problem, or `P3` polish.

## Headless invocation and usage

Authenticate `agy` once interactively. Then run a named persona with structured output:

```bash
agy -p "<bounded assignment>" \
  --agent aamish-employee-tester \
  --mode plan \
  --effort low \
  --output-format json \
  --print-timeout 5m
```

The JSON envelope includes `usage.input_tokens`, `usage.output_tokens`, `usage.thinking_tokens`, and `usage.total_tokens`. The primary contributor records those values with the task evidence and rejects empty or permission-denied runs rather than retrying blindly.

Headless mode cannot answer interactive permission prompts. Configure only the minimum read/browser permissions needed for the named QA environment. Never use `--dangerously-skip-permissions`.

## Triage ownership

The primary contributor reviews every finding, reproduces material defects, deduplicates them, and creates one GitHub issue per coherent task. Gemini personas cannot approve a PR or merge into `dev` or `main`.
