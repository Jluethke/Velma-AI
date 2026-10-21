# GitHub Required Status Checks and Branch Protection

**One-line description:** Makes CI results block merges on the default branch by configuring a ruleset (or classic branch protection) that requires the exact check names CI reports, using a single always-reporting aggregate job so matrix and skipped jobs cannot leave a check pending or falsely green.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_slug` (string, required): `owner/repo`.
- `default_branch` (string, required): Branch to protect, for example `main`.
- `check_run_names` (string[], required): Check names CI reports on a recent commit, from `ci0-gha-test-matrix` or read with the API.

---

## Outputs

- `protection_record` (object): `{mechanism, required_checks[], ruleset_id_or_url, readback_json, blocked_pr_evidence}`.

---

## Phase 1: Choose What to Require

### Entry Criteria
- The caller has admin rights: `gh api repos/<repo_slug> --jq .permissions.admin` prints `true`.

### Actions
1. Read current check names from a recent default-branch commit, not from YAML: `gh api repos/<repo_slug>/commits/<default_branch>/check-runs --jq '.check_runs[] | [.name, .app.slug] | @tsv'`. Compare to `check_run_names`.
2. Apply this rule: if any required job is a matrix or is skipped under some conditions, require one aggregate job instead of each cell. Add it to the CI workflow:
```yaml
  ci-ok:
    if: always()
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - name: all needed jobs succeeded
        run: |
          echo '${{ toJSON(needs) }}' | jq -e 'all(.[]; .result == "success")'
```
3. Reasons, which the rules below rely on: GitHub treats a skipped job as a passing check, so a skipped required job does not block. A required check that never reports (workflow filtered by `paths:`) stays "Expected" and blocks every PR forever. Matrix check names change when the matrix changes. The aggregate job avoids all three.
4. If the user wants `skipped` to count as acceptable for some needs, change the jq test to `.result == "success" or .result == "skipped"` only for those, and record the decision.
5. Record the app slug for each required name (`github-actions` for workflow jobs). Requiring a check name without the app lets any app (or any status from a token) satisfy it.

### Output
List of required checks with app slug.

### Quality Gate
- Every required name appears in the check-runs API output of a real commit.
- The aggregate job has `if: always()` and `needs:` lists every job that must pass.

---

## Phase 2: Apply the Rule

### Entry Criteria
- Required list decided; aggregate job merged or present on the branch.

### Actions
1. Prefer a repository ruleset (works for multiple branches, visible in Settings, Rules). Write `ruleset.json`:
```json
{
  "name": "protect-default",
  "target": "branch",
  "enforcement": "active",
  "conditions": {"ref_name": {"include": ["~DEFAULT_BRANCH"], "exclude": []}},
  "rules": [
    {"type": "pull_request", "parameters": {"required_approving_review_count": 1, "dismiss_stale_reviews_on_push": true, "require_code_owner_review": false, "require_last_push_approval": false, "required_review_thread_resolution": false}},
    {"type": "required_status_checks", "parameters": {"strict_required_status_checks_policy": false, "required_status_checks": [{"context": "ci-ok", "integration_id": 15368}]}},
    {"type": "non_fast_forward"}
  ]
}
```
   `required_approving_review_count` and `strict_required_status_checks_policy` are the user's choices; ask. `integration_id` 15368 is the GitHub Actions app ID; confirm with `gh api /apps/github-actions --jq .id`. Check field names against the REST docs for rulesets before sending.
2. Apply: `gh api -X POST repos/<repo_slug>/rulesets --input ruleset.json`.
3. Classic branch protection is the alternative when rulesets are unavailable: `gh api -X PUT repos/<repo_slug>/branches/<default_branch>/protection --input protection.json` with keys `required_status_checks` (`strict`, `checks: [{context, app_id}]`), `enforce_admins`, `required_pull_request_reviews`, `restrictions` (all four keys are required; use `null` to disable one).
4. Do not remove existing rules the user created. Read existing ones first: `gh api repos/<repo_slug>/rulesets` and merge.

### Output
Active ruleset or protection.

### Quality Gate
- Readback `gh api repos/<repo_slug>/rules/branches/<default_branch>` lists a `required_status_checks` rule containing each required context.
- Existing rules listed before the change still appear after it.

---

## Phase 3: Prove It Blocks

### Entry Criteria
- Rule active.

### Actions
1. Open a throwaway PR whose CI fails (for example a deliberate lint error).
2. Read merge state: `gh pr view <n> --json mergeStateStatus,statusCheckRollup --jq '.mergeStateStatus, (.statusCheckRollup[] | [.name,.conclusion] | @tsv)'`. Expected `BLOCKED` while `ci-ok` is failing.
3. Try `gh pr merge <n> --merge` without admin override and record the refusal message.
4. Close the PR and delete its branch.

### Output
`protection_record`.

### Quality Gate
- `mergeStateStatus` printed `BLOCKED` for the failing PR.
- The merge attempt was refused and the message is saved in `blocked_pr_evidence`.

---

## Worked Example

Illustrative only. `repo_slug=acme/invoice-api`, checks `lint`, `test (ubuntu-latest, 3.11)`, `test (ubuntu-latest, 3.12)`.

Phase 1: matrix present, so aggregate `ci-ok` added; user picks 1 approval, strict off.
Phase 2: `gh api -X POST repos/acme/invoice-api/rulesets --input ruleset.json` returns `"id": 412907`. Readback shows `required_status_checks` with `ci-ok`.
Phase 3:
```
$ gh pr view 88 --json mergeStateStatus --jq .mergeStateStatus
BLOCKED
$ gh pr merge 88 --merge
X Pull request acme/invoice-api#88 is not mergeable: the base branch policy prohibits the merge.
```

---

## Exit Criteria

DONE when the default branch requires the aggregate CI check from the GitHub Actions app, readback confirms it, and a failing PR is shown blocked.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Caller is not admin | **Return**: hand the JSON and command to a repository admin. |
| Phase 1 | Required name not in any check-runs output | **Stop**: requiring it would block all PRs; fix the name first. |
| Phase 2 | API returns 422 validation failed | **Adjust**: read the `errors` array and fix the named field from the REST docs; never guess keys. |
| Phase 2 | Rulesets not available on the plan for a private repo | **Adjust**: use classic branch protection, or report if neither is available. |
| Phase 3 | Failing PR shows `CLEAN` or `UNSTABLE` | **Stop**: the required check is not enforced; recheck context name and app ID. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
