# Post-Merge Verification

**One-line description:** After the pull request merges, proves the change is actually on the base branch, that the base branch's CI run for the merge commit passed, that the deployed or released artifact carries the commit when the repo deploys from the base, that each acceptance criterion holds there, and then closes the ticket and cleans up branches.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pr_url` (string, required): Output of `tkt-pr-description`.
- `base_branch` (string, optional): Base branch; defaults to the PR's base.
- `acceptance_criteria` (object[], required): Output of `tkt-acceptance-criteria-gwt`.
- `ticket_id` (string, required): Tracker key.
- `ci_status` (object, required): Output of `tkt-ci-check-triage`.
- `review_resolution` (object[], required): Output of `tkt-review-comment-response`.

---

## Outputs

- `post_merge_report` (object): Merge commit hash and method, base-branch CI run id and result, deployment or release evidence (or `not deployed by this repo`), per-criterion verification result, ticket state change, and branches deleted.

---

## Phase 1: Confirm the Merge Landed

### Entry Criteria
- `ci_status` shows all required checks passing or only evidenced pre-existing or flaky failures.
- Every row in `review_resolution` has a reply.

### Actions
1. Read the PR state: `gh pr view <number> --json state,mergedAt,mergeCommit,baseRefName --jq '{state, mergedAt, sha: .mergeCommit.oid, base: .baseRefName}'`. `state` must be `MERGED`. If it is `OPEN`, the PR is not merged yet; wait or merge per repo policy (`gh pr merge <number> --squash|--rebase|--merge`, using the method the repo allows, only if you have been asked to merge).
2. Fetch and confirm the merge commit is on the base: `git fetch origin <base>` then `git merge-base --is-ancestor <merge sha> origin/<base> && echo on-base`.
3. For squash or rebase merges, your branch's commit hashes are not on the base; check content instead: `git diff <merge sha>^ <merge sha> --stat` should list the same files as the PR (`gh pr diff <number> --name-only`).

### Output
Merge commit hash confirmed on base.

### Quality Gate
- `git merge-base --is-ancestor <merge sha> origin/<base>` exits 0.
- File list of the merge commit equals the PR's file list.

---

## Phase 2: Base-Branch CI and Deployment

### Entry Criteria
- Merge confirmed.

### Actions
1. Find the CI run for the merge commit on the base: `gh run list --branch <base> --commit <merge sha> --json databaseId,name,status,conclusion`. Wait for completion: `gh run watch <run id> --exit-status`.
2. If the base-branch run fails where the PR run passed, classify with the table in `tkt-ci-check-triage` Phase 2. A semantic conflict (two PRs that each passed alone but break together) shows up here first. If caused by this change, follow the decision table in Phase 3.
3. Deployment check, only if the repo deploys from the base branch (look for a deploy job in `.github/workflows/*.yml` triggered `on: push: branches: [<base>]`, or a GitHub Environment): `gh api repos/{owner}/{repo}/deployments --jq '.[] | select(.sha=="<merge sha>") | {id, environment, created_at}'`, then read the status: `gh api repos/{owner}/{repo}/deployments/<id>/statuses --jq '.[0].state'`. Also check the service's version endpoint or build info if it exposes the commit (`curl -s https://<host>/version`).
4. For libraries released by tag, record that the change is pending the next release and which release workflow publishes it.

### Output
CI and deployment evidence.

### Quality Gate
- Base-branch run for `<merge sha>` has `conclusion` `success`, or its failure is classified with evidence.
- Deployment state is `success` with the matching sha, or the report states `not deployed by this repo` citing the workflow files read.

---

## Phase 3: Verify Behavior, Close Out

### Entry Criteria
- CI evidence recorded.

### Actions
1. For each acceptance criterion, verify on the deployed environment if one exists (staging first), using the observable in its test hint: HTTP request with `curl -i`, CLI command, or UI check. Record the command and the observed value. If no environment exists, the base-branch CI run of the criterion's test is the evidence; name the test and the run id.
2. If any criterion fails after merge, use this table:

| Situation | Action |
|---|---|
| Production impact or data at risk | Revert immediately: `gh pr view <number>` then the "Revert" button, or `git revert -m 1 <merge sha>` for merge commits (`git revert <sha>` for squash), opened as a new PR. Reopen the ticket. |
| No user impact, fix is small and clear | New ticket or reopen; fix forward through the chain with a `fix:` commit. |
| Unsure | Treat as production impact; revert first. |

3. Update the ticket: move it to Done (or the team's equivalent) with a comment containing the PR link, merge sha, and verification evidence. GitHub issues referenced with `Closes #n` close automatically when merged into the default branch; confirm with `gh issue view <n> --json state`.
4. Delete the remote branch if the repo did not auto-delete it: `git push origin --delete <branch_name>` (check first: `git ls-remote --heads origin <branch_name>`). Delete local branches: `git switch <base> && git pull --ff-only && git branch -d <branch_name>` (use `-d`, not `-D`; for squash merges `-d` refuses because the commits are not ancestors, then confirm the content check from Phase 1 passed and use `git branch -D <branch_name>`). Delete backup refs created earlier (`git branch -D backup/...`).

### Output
`post_merge_report`.

### Quality Gate
- Every acceptance criterion has a verification command and observed value, or a named base-branch CI test and run id.
- `gh issue view` or the tracker shows the ticket closed with the evidence comment, and `git ls-remote --heads origin <branch_name>` prints nothing.

---

## Worked Example

Illustrative only.

```
$ gh pr view 1907 --json state,mergedAt,mergeCommit --jq '{state, sha: .mergeCommit.oid}'
{"sha":"8d7c6b5a...","state":"MERGED"}
$ git fetch origin develop && git merge-base --is-ancestor 8d7c6b5a origin/develop && echo on-base
on-base
$ gh run list --branch develop --commit 8d7c6b5a --json databaseId,conclusion
[{"conclusion":"success","databaseId":10044}]
$ gh api repos/acme/billing/deployments --jq '.[] | select(.sha|startswith("8d7c6b5a")) | {id, environment}'
{"environment":"staging","id":771}
$ gh api repos/acme/billing/deployments/771/statuses --jq '.[0].state'
success
$ curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $STAGING_TOKEN" "https://staging.billing.example/accounts/77/invoices/export?status=paid"
200
$ git push origin --delete feat/PAY-412-invoice-csv-export
```

`post_merge_report`: merged 8d7c6b5 (rebase merge), develop CI 10044 success, staging deployment 771 success, AC1 to AC5 verified on staging, PAY-412 moved to Done with evidence comment, branches deleted.

---

## Exit Criteria

DONE when the merge commit is confirmed on the base, its base-branch CI run passed, deployment evidence or a cited "not deployed" is recorded, every acceptance criterion is verified after merge, the ticket is closed with evidence, and topic branches are deleted.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | PR still open | **Stop**: merging is the maintainer's or user's decision unless you were asked to merge. |
| Phase 2 | Base-branch CI fails due to this change | **Adjust**: follow the Phase 3 revert table; never push a fix directly to the base branch without a PR. |
| Phase 2 | Deployment stuck or failed | **Return**: report the deployment status and logs link to the owning team; do not redeploy manually unless that is documented. |
| Phase 3 | Criterion fails in staging only | **Adjust**: compare config and data between staging and CI; record the difference and open a fix ticket. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
