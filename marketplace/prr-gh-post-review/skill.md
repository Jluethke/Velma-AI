# Post a GitHub Pull Request Review with Inline Comments

**One-line description:** Posts all review comments as a single GitHub pull request review through the REST endpoint `POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews` with `gh api`, anchored to the reviewed commit with `line` and `side`, using the event that matches the verdict, then verifies the review and its comment count on the PR.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone whose `origin` is the GitHub repository.
- `pr_number` (integer, required): Pull request number.
- `head_sha` (string, required): The commit the comments were written against.
- `review_comments` (object[], required): Comments from `prr-severity-comments`.
- `review_verdict` (string, required): `APPROVE`, `REQUEST_CHANGES`, or `COMMENT`.
- `verdict_rationale` (string, required): Summary body.

---

## Outputs

- `posted_review_url` (string): The `html_url` of the created review.

---

## Phase 1: Build the Review Payload

### Entry Criteria
- `gh auth status` shows a logged-in account with write or triage access to the repository.
- `gh pr view <pr_number> --json headRefOid -q .headRefOid` equals `head_sha`. If not, stop: comments may point at moved lines.

### Actions
1. Map `review_verdict` to the API `event`: APPROVE to `APPROVE`, REQUEST_CHANGES to `REQUEST_CHANGES`, COMMENT to `COMMENT`.
2. Build `../review.json` outside the repository:
   ```
   {
     "commit_id": "<head_sha>",
     "event": "<event>",
     "body": "<verdict_rationale>",
     "comments": [
       { "path": "invoices/views.py", "line": 4, "side": "RIGHT", "body": "**issue (blocking):** ..." },
       { "path": "orders/repo.py", "start_line": 50, "line": 52, "side": "RIGHT", "start_side": "RIGHT", "body": "..." }
     ]
   }
   ```
   `line` is the line number in the file on the given side; multi-line comments add `start_line` and `start_side`. Use `side: "LEFT"` only for comments on deleted lines.
3. Put file-level comments (line null) into the review `body` under a "File comments" heading; inline comments need a line inside the diff.
4. Build the JSON with a serializer (for example `python -c "import json,sys; ..."` reading the comments file, or `jq`), not by string concatenation, so quotes and newlines in bodies are escaped.
5. Validate: `python -m json.tool ../review.json > /dev/null`.

### Output
`../review.json`.

### Quality Gate
- `python -m json.tool ../review.json` exits 0.
- The number of entries in `comments` equals the number of inline items in `review_comments`.

---

## Phase 2: Post the Review

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Post as one review (one notification for the author, all comments atomic):
   `gh api --method POST repos/{owner}/{repo}/pulls/<pr_number>/reviews --input ../review.json`
   Run it from inside `repo_dir`; `gh api` fills `{owner}` and `{repo}` from the current repository.
2. Read the response JSON: `id`, `state` (`APPROVED`, `CHANGES_REQUESTED`, `COMMENTED`), `html_url`.
3. Response handling:

| Response | Meaning | Action |
|---|---|---|
| 200 with `state` matching the event | Posted | Save `html_url` |
| 422 "Can not approve your own pull request" or "Can not request changes on your own pull request" | You are the author | Change `event` to `COMMENT` and repost |
| 422 mentioning `line` or "could not be resolved" | A comment line is outside the diff | Move that comment into the body and repost |
| 403 or 404 | Token lacks access, or wrong repository | Check `gh repo view` and `gh auth status` scopes |

4. Do not post comments one by one with separate calls; that sends one notification per comment and can leave a half-posted review on failure.
5. Simple fallback with no inline comments: `gh pr review <pr_number> --approve -b "<body>"`, `--request-changes -b "<body>"`, or `--comment -b "<body>"`.

### Output
`posted_review_url`.

### Quality Gate
- The response has `html_url` and a `state` matching the requested event.

---

## Phase 3: Verify on the PR

### Entry Criteria
- Phase 2 returned a review `id`.

### Actions
1. List the review's comments: `gh api repos/{owner}/{repo}/pulls/<pr_number>/reviews/<id>/comments --paginate --jq 'length'`. The count must equal the inline comment count.
2. Confirm the PR's review decision: `gh pr view <pr_number> --json reviewDecision,latestReviews`.
3. Delete `../review.json` after success; it is scratch.

### Output
Verified review.

### Quality Gate
- The comment count from step 1 equals the number of inline comments sent.
- `latestReviews` contains your review with the expected state.

---

## Worked Example

Illustrative. `pr_number=482`, verdict REQUEST_CHANGES, 2 inline comments, 1 file comment.

- Phase 1: `../review.json` has `"event": "REQUEST_CHANGES"`, `commit_id` = `9f3c1e0...`, 2 comments; the file comment went into `body`.
- Phase 2: `gh api --method POST repos/{owner}/{repo}/pulls/482/reviews --input ../review.json` returns `{"id": 1834403921, "state": "CHANGES_REQUESTED", "html_url": "https://github.com/acme/shop/pull/482#pullrequestreview-1834403921", ...}`.
- Phase 3: `gh api repos/{owner}/{repo}/pulls/482/reviews/1834403921/comments --jq 'length'` prints `2`. `reviewDecision` = `CHANGES_REQUESTED`.

---

## Exit Criteria

DONE when one review containing every inline comment is posted against the reviewed commit with the event matching the verdict, and the posted comment count is verified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Head moved since review | **Return**: rerun the review on the new head before posting. |
| Phase 2 | 422 on a line | **Adjust**: move the offending comment into the body and repost. |
| Phase 2 | 422 own PR | **Adjust**: repost with `event` `COMMENT`. |
| Phase 3 | Comment count lower than sent | **Retry**: list review comments with `--paginate`; if still short, post the missing ones in a new COMMENT review. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
