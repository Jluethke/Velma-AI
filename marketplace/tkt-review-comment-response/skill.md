# Responding to Review Comments

**One-line description:** Pulls every review thread on a pull request, classifies each comment (blocking defect, requested change, question, nit, out of scope) with a fixed table, answers or fixes each one in its own small commit, replies in-thread with the commit hash and evidence, and re-requests review only when every thread has a response.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pr_url` (string, required): Output of `tkt-pr-description`.
- `acceptance_criteria` (object[], required): Output of `tkt-acceptance-criteria-gwt`, used to judge scope.

---

## Outputs

- `review_resolution` (object[]): One row per comment: comment id, author, file:line, class, action taken (fixed, answered, declined with reason, ticket opened), fix commit hash, reply text, and resulting thread state.

---

## Phase 1: Collect Every Thread

### Entry Criteria
- The PR has at least one review or comment.

### Actions
1. Get review summaries: `gh pr view <number> --json reviews --jq '.reviews[] | {author: .author.login, state, body}'`. A `CHANGES_REQUESTED` state blocks merge until that reviewer approves or the review is dismissed.
2. Get inline comments with ids and positions: `gh api repos/{owner}/{repo}/pulls/<number>/comments --paginate --jq '.[] | {id, user: .user.login, path, line, body, in_reply_to_id}'`. Comments with `in_reply_to_id` belong to an existing thread.
3. Get top-level conversation comments: `gh pr view <number> --comments`.
4. Build one row per thread root. Include outdated threads (their `line` may be null because the code moved); they still need an answer.

### Output
Thread list.

### Quality Gate
- The count of thread roots equals the number of comments without `in_reply_to_id` from Action 2 plus the review bodies and conversation comments that ask for something.

---

## Phase 2: Classify

### Entry Criteria
- Thread list built.

### Actions
1. Classify each thread (first match wins):

| The comment... | Class | Required action |
|---|---|---|
| Points to wrong behavior, a bug, a security issue, data loss, or a broken acceptance criterion | blocking | Reproduce with a test, fix, reply with commit and test output. |
| Asks for a specific code change (naming, structure, extra test) in lines this PR touches | requested-change | Make the change, unless it conflicts with a documented repo rule; then answer citing the rule. |
| Asks a question ("why", "what happens if") | question | Answer with evidence (file:line, test, doc link). If the answer reveals a gap, reclassify as blocking. |
| Is marked nit, optional or a style preference not enforced by the linter | nit | Apply if it takes one small edit in a touched line; otherwise reply that you are leaving it, with the reason. |
| Asks for work outside the acceptance criteria | out-of-scope | Reply proposing a follow-up ticket; open it if the reviewer agrees; link it. |
| Contains a GitHub suggestion block | requested-change | Apply it via the UI "Commit suggestion" or by hand; run tests after. |

2. Never mark a blocking comment as nit or out-of-scope to avoid a fix.
3. If two reviewers ask for conflicting changes, do not pick one; reply to both in the thread tagging each other and ask them to agree.

### Output
Classified threads.

### Quality Gate
- Every thread has exactly one class.
- Every `out-of-scope` row cites the acceptance criteria it falls outside of.

---

## Phase 3: Fix, Reply, Re-request

### Entry Criteria
- Threads classified.

### Actions
1. For each blocking and requested-change thread, one at a time: make the change through `tkt-small-edit-loop` (one file, test, commit). Commit message: `fix(<scope>): <what>` or the type that fits, or `git commit --fixup=<original commit sha>` if the repo squashes fixups before merge (then `git rebase --autosquash origin/<base>` before merge; Git 2.44 and newer allow `--autosquash` without `-i`, older versions need the interactive editor, which this flow does not use).
2. Run the stack's static check flow again if code changed.
3. Push the commits: `git push` (or `--force-with-lease` if history was rewritten). Prefer adding commits during review; rewriting history mid-review makes reviewers lose their place unless the repo asks for it.
4. Reply in the thread, not as a new top-level comment: `gh api repos/{owner}/{repo}/pulls/<number>/comments/<comment id>/replies -f body="Fixed in <sha>: <one sentence>. Test: <command> -> <summary line>"`.
5. Reply format by class: blocking/requested-change = commit sha plus evidence; question = the answer plus file:line or link; nit not applied = the reason; out-of-scope = the follow-up ticket link.
6. Do not resolve threads someone else opened unless the repo's convention says the author resolves; many teams expect the reviewer to resolve.
7. When every thread has a reply, re-request review: `gh pr edit <number> --add-reviewer <login>` (re-requests from a reviewer who already reviewed), or the "Re-request review" button.

### Output
`review_resolution`.

### Quality Gate
- Every thread root has a reply from you (check with the Action 2 command in Phase 1: each root id appears as some comment's `in_reply_to_id`).
- Every blocking or requested-change row has a commit sha that `git branch -r --contains <sha>` shows on `origin/<branch_name>`.

---

## Worked Example

Illustrative only.

```
$ gh api repos/acme/billing/pulls/1907/comments --jq '.[] | {id, user: .user.login, path, line, body}'
{"id":5501,"user":"rchen","path":"src/billing/api/routes.py","line":47,"body":"What happens if status is an unknown value? Looks like it returns everything."}
{"id":5502,"user":"rchen","path":"src/billing/api/responses.py","line":20,"body":"nit: columns could be a tuple"}
{"id":5503,"user":"mlopez","path":"src/billing/api/routes.py","line":40,"body":"Can we also add XLSX while we're here?"}
```

Classification: 5501 question, then reclassified blocking (unknown status returns all rows, contradicting AC3's intent). 5502 nit (applied, one edit). 5503 out-of-scope.

5501: added test `test_export_rejects_unknown_status` expecting 422, fixed validation with an `Enum` parameter, commit `f1e2d3c`. Reply: `Fixed in f1e2d3c: unknown status now returns 422. Test: uv run pytest tests/api/test_export.py -q -> 6 passed in 1.20s`. 5503 reply: `Outside PAY-412's criteria; opened PAY-430 for XLSX export.` Then `gh pr edit 1907 --add-reviewer rchen`.

---

## Exit Criteria

DONE when every review thread has an in-thread reply, every blocking and requested-change comment has a pushed fix commit with test evidence, out-of-scope requests have follow-up tickets, and review has been re-requested.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `gh api` returns 404 | **Adjust**: check `{owner}/{repo}` from `gh repo view --json nameWithOwner`; placeholders fill in only inside a cloned repo. |
| Phase 2 | Reviewers conflict | **Stop**: ask both to agree in the thread; do not implement either version first. |
| Phase 3 | Requested change breaks other tests | **Return**: reply with the failing test name and output and ask how to proceed. |
| Phase 3 | Reviewer disagrees with a declined nit | **Adjust**: apply it if it is within touched lines; style debates are not worth blocking merge. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
