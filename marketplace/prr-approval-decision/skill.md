# PR Approval Decision

**One-line description:** Decides approve, request changes, or comment from explicit criteria (every review unit read, zero blocking comments, required CI checks green on the reviewed head, no unresolved security or secret finding, no unanswered question that could hide a defect), verified with forge commands rather than impressions, and writes the rationale that goes with the verdict.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone path.
- `pr_number` (integer, required): PR or MR number.
- `forge` (string, required): `github` or `gitlab`.
- `head_sha` (string, required): The PR head commit that was reviewed.
- `review_comments` (object[], required): Labeled comments from `prr-severity-comments`.
- `blocking_count` (integer, required): Number of blocking comments.
- `review_units` (object[], required): Units from `prr-large-pr-split`.
- `findings_dir` (string, required): Findings directory, read to confirm which flows ran.

---

## Outputs

- `review_verdict` (string): `APPROVE`, `REQUEST_CHANGES`, or `COMMENT`.
- `verdict_rationale` (string): Summary body: the criteria table with each result, counts per label, and the blocking items.

---

## Phase 1: Verify Coverage of the Review

### Entry Criteria
- `review_comments` and `blocking_count` exist.

### Actions
1. Confirm every unit in `review_units` was read: each unit's paths appear in the reading plan and at least the correctness pass covered them. If a unit was skipped, the verdict cannot be APPROVE.
2. List which review flows produced a file: `ls <findings_dir>/prr-*.json`. Compare with the flows the chain ran (a flow skipped by a chain condition such as a different `stack` is fine; a flow that should have run and has no file is a gap).
3. Confirm the head has not moved since review: `gh pr view <pr_number> --json headRefOid -q .headRefOid` (github) or `glab mr view <pr_number> -F json` field `sha` (gitlab) must equal `head_sha`. If the author pushed new commits, review the new commits first (`git diff <old_head>..<new_head>`).

### Output
Coverage status: units read, flows ran, head unchanged.

### Quality Gate
- Every review unit is marked read or skipped.
- The forge head SHA equals the reviewed SHA, or the delta was reviewed.

---

## Phase 2: Check CI and Required Checks

### Entry Criteria
- Phase 1 complete.

### Actions
1. Read check status:

| `forge` | Command | How to read it |
|---|---|---|
| github | `gh pr checks <pr_number>` | Exit 0 means all checks passed; exit 8 means some are pending; non-zero otherwise means a failure. `gh pr checks <pr_number> --required` limits to required checks. |
| gitlab | `glab ci status` on the MR source branch, or `glab mr view <pr_number> -F json` field `head_pipeline.status` | `success` is green; `failed`, `running`, `pending`, `canceled` are not |

2. Read mergeability: `gh pr view <pr_number> --json mergeable,mergeStateStatus,reviewDecision` or the GitLab MR JSON fields `merge_status`/`detailed_merge_status` and `has_conflicts`.
3. Record each value verbatim.

### Output
CI status and merge state.

### Quality Gate
- The CI command's exit code or status field is recorded verbatim.

---

## Phase 3: Apply the Decision Table and Write the Rationale

### Entry Criteria
- Phases 1 and 2 complete.

### Actions
1. Evaluate rows top to bottom; the first match decides:

| Condition | `review_verdict` |
|---|---|
| `blocking_count` > 0 | REQUEST_CHANGES |
| Any secret or security finding unresolved (in `prr-gitleaks-secrets-scan.json` or `prr-owasp-security-pass.json` or a stack SAST file with label blocking) | REQUEST_CHANGES |
| A review unit was skipped, or a flow that should have run produced no file | COMMENT (state what is not reviewed) |
| A non-blocking question whose answer could reveal a correctness or security defect is open | COMMENT |
| Required CI checks failing | REQUEST_CHANGES if the failure is caused by the PR, else COMMENT asking for a rerun |
| Required CI checks pending | COMMENT (do not approve code whose checks have not finished) |
| Merge conflicts | COMMENT asking for a rebase or merge |
| None of the above | APPROVE (nits and suggestions may remain; say they are optional) |

2. Platform constraints: GitHub rejects approval of your own PR ("Can not approve your own pull request"); if you are the author, the verdict is COMMENT. On GitLab, approval rules (required approvers, code owners) are configured per project; your approval may not be sufficient alone, so state that in the rationale.
3. Write `verdict_rationale`:
   - one line: verdict and the deciding row;
   - criteria table with each row's result;
   - counts per label;
   - list of blocking comments as `file:line - one-line summary`;
   - for APPROVE with nits: "Nits and suggestions are optional; approve stands either way."

### Output
`review_verdict`, `verdict_rationale`.

### Quality Gate
- The verdict matches the first true row of the table (re-evaluate each row and record true or false).
- `verdict_rationale` contains the deciding row and the label counts.

---

## Worked Example

Illustrative. `blocking_count=0`, 3 nits, 1 question ("Is `retry` idempotent for the payment provider?"), `forge=github`.

- Phase 1: all 2 units read; flows for `stack=python` all produced files; head SHA unchanged.
- Phase 2: `gh pr checks 482 --required` exit 0; `mergeStateStatus` = `CLEAN`.
- Phase 3: row 1 false, row 2 false, row 3 false, row 4 true: the open question could reveal a double-charge defect. Verdict COMMENT. Rationale: "COMMENT: open question on retry idempotency could reveal a correctness defect. Counts: 0 blocking, 3 nitpick, 1 question. Will approve once answered."

---

## Exit Criteria

DONE when coverage, CI and merge state are verified with forge commands, the verdict follows the first true row of the decision table, and the rationale records every row's result.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Author pushed new commits after review | **Return**: review `git diff <reviewed_sha>..<new_sha>` with the same flows, then rerun this flow. |
| Phase 2 | `gh` or `glab` not authenticated | **Stop**: run `gh auth status` / `glab auth status`; never decide without CI status. |
| Phase 2 | Repository has no CI | **Adjust**: state "no CI" in the rationale; require that the reviewer ran the test command locally with exit 0. |
| Phase 3 | Reviewer is the author | **Adjust**: verdict COMMENT; request another reviewer. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
