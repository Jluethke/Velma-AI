# PR Review Comments with Severity Labels

**One-line description:** Merges every findings file from the review into deduplicated, line-anchored comments written in the Conventional Comments format with an explicit severity (blocking, nit, question, suggestion), each stating the observation, the evidence and a concrete fix, and counts the blocking comments for the approval decision.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `findings_dir` (string, required): Directory holding one `prr-*.json` findings file per review flow that ran.
- `diff_file` (string, required): Saved PR diff, used to confirm each comment's line is in the diff.
- `head_sha` (string, required): PR head commit the comments anchor to.

---

## Outputs

- `review_comments` (object[]): `{ "path": "...", "line": N, "side": "RIGHT", "label": "issue|suggestion|question|nitpick|praise", "decoration": "blocking|non-blocking", "body": "..." }`, plus file-level comments with `line` null.
- `blocking_count` (integer): Number of comments with decoration `blocking`.

---

## Phase 1: Merge and Deduplicate Findings

### Entry Criteria
- `findings_dir` contains at least one `prr-*.json` file. Flows that were skipped by a chain condition have no file; that is expected.

### Actions
1. Load every file: `ls <findings_dir>/prr-*.json`, and validate each with `python -m json.tool <file> > /dev/null`. A file that fails validation stops the merge (see Error Handling).
2. Concatenate all items. Keep each item's `flow` so the source is traceable.
3. Deduplicate: two items with the same `file`, the same `line` (or overlapping lines) and the same root cause (for example the same SQL injection reported by the security pass and by Semgrep) become one item. Keep the strongest `proposed_label` and combine both evidences.
4. Confirm each item's line is on the RIGHT (new) side of the diff: the line must fall in a hunk's new range `+c,d` in `diff_file`. Forges reject inline comments on lines outside the diff. Items on lines outside the diff become file-level comments or go into the summary.

### Output
Merged, deduplicated item list with anchor type (inline or file-level).

### Quality Gate
- Every `prr-*.json` file in `findings_dir` passed `python -m json.tool`.
- No two items share file, line and root cause.

---

## Phase 2: Assign the Final Severity

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Map each item to a Conventional Comments label (conventionalcomments.org) and a decoration with this table. The finding's `proposed_label` is the starting point; the table overrides it.

| Condition | Label | Decoration |
|---|---|---|
| Proven defect: failing scratch test, traced security issue, data race report, breaking change not intended, secret, migration that blocks writes on a live table | issue | blocking |
| Required by a written project rule (CI-enforced lint, CONTRIBUTING requirement) | issue | blocking |
| Better approach exists but current code is correct | suggestion | non-blocking |
| Reviewer does not know whether it is a defect | question | non-blocking (becomes blocking only if the answer reveals a defect) |
| Style or naming preference with no rule behind it | nitpick | non-blocking |
| Something done notably well (a good regression test, a clean migration) | praise | none |

2. Never mark a comment blocking because of personal preference, and never mark a proven defect as a nit to be polite.
3. Add at most a few praise comments where they are specific ("this test reproduces the exact bug input"), not generic.

### Output
Item list with final label and decoration.

### Quality Gate
- Every item has exactly one label and one decoration from the table.
- Every blocking item has evidence from a tool output, a test, or a written trace.

---

## Phase 3: Write the Comment Bodies

### Entry Criteria
- Phase 2 complete.

### Actions
1. Write each body in this shape:
   ```
   **issue (blocking):** <one-sentence observation about the code>

   <evidence: tool output line, failing test output, or the trace, in a code block>

   <fix: the concrete change, as a GitHub suggestion block when it is a small in-place edit>
   ```
   For a small edit on GitHub use a suggestion block, which the author can apply with one click:
   ````
   ```suggestion
   rows = db.execute("SELECT * FROM invoices WHERE id = %s AND owner_id = %s", (invoice_id, user.id))
   ```
   ````
   GitLab supports the same with ```` ```suggestion:-0+0 ````.
2. Rules for every body:
   - Talk about the code, not the person ("this function returns None when...", not "you forgot...").
   - One issue per comment.
   - Questions are real questions with the scenario: "What happens when `items` is empty? `items[0]` on line 14 would raise `IndexError`."
   - Do not write "just", "simply", "obviously".
   - Do not paste secrets or exploit payloads.
3. Write `review_comments` as JSON and count `blocking_count` = number with decoration `blocking`.
4. Draft a summary body: one line with the counts per label, the list of blocking comments as links or file:line, and which review flows ran.

### Output
`review_comments`, `blocking_count`.

### Quality Gate
- Every body starts with `**<label> (<decoration>):**` or `**praise:**`.
- `blocking_count` equals the number of bodies starting with a `(blocking)` decoration (`grep -c '(blocking)'` over the bodies).

---

## Worked Example

Illustrative. `findings_dir` has `prr-owasp-security-pass.json` (A01 on `invoices/views.py:4`), `prr-py-bandit-semgrep.json` (nothing on that line), `prr-readability-naming.json` (vague name `row`, line 4).

- Phase 1: 2 items; both are on line 4 but different root causes, so both kept. Line 4 is in hunk `@@ -0,0 +1,5 @@`: inline.
- Phase 2: A01 traced: issue (blocking). Name: nitpick (non-blocking).
- Phase 3:
  ```
  **issue (blocking):** Any logged-in user can read any invoice by changing the ID in the URL.

  `get_invoice` checks `@login_required` but selects by `id` only; no owner filter (A01 Broken Access Control).

  ```suggestion
      row = db.execute("SELECT * FROM invoices WHERE id = %s AND owner_id = %s", (invoice_id, current_user.id)).fetchone()
  ```
  ```
  `blocking_count` = 1.

---

## Exit Criteria

DONE when all findings files are merged and deduplicated, every comment is anchored to a diff line or the file, labeled by the table, written with observation, evidence and fix, and `blocking_count` matches the bodies.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A findings file is invalid JSON | **Return**: rerun the flow that wrote it; do not hand-repair partial JSON. |
| Phase 1 | `findings_dir` is empty | **Stop**: no review flow ran; the review is not complete. |
| Phase 2 | Two flows disagree on severity for the same issue | **Adjust**: use the table; record both sources in the evidence. |
| Phase 3 | Fix is unknown | **Adjust**: write it as a question with the failing scenario instead of guessing a fix. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
