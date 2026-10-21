# PR Intent and Scope Check

**One-line description:** Turns the PR description and linked issue into a one-sentence intent statement with checkable acceptance criteria, then classifies every changed file as in scope, supporting or out of scope, so the reviewer can flag missing work and unrelated changes before reading any code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pr_description` (string, required): PR title and body.
- `changed_files` (object[], required): Rename-aware file list from `prr-fetch-pr-diff` (or `prr-self-review-before-request`).
- `findings_dir` (string, required): Directory where every review flow writes its findings file.
- `linked_issue` (string, optional): Issue reference such as `#1234`, `PROJ-88`, or a URL.
- `role` (string, optional): `reviewer` (default) or `author`. As author, the output feeds the PR description instead of review comments.

---

## Outputs

- `intent_statement` (object): `{ "sentence": "...", "acceptance_criteria": ["..."], "non_goals": ["..."] }`.
- `scope_findings` (object[]): Findings for missing criteria and out-of-scope files, also written to `<findings_dir>/prr-intent-scope-check.json`.

---

## Phase 1: Write the Intent Statement

### Entry Criteria
- `pr_description` is non-empty. An empty description is itself a finding (see Error Handling).

### Actions
1. If `linked_issue` is given, fetch it: `gh issue view <n> --json title,body` (GitHub), `glab issue view <n>` (GitLab), or open the tracker URL. Copy its acceptance criteria verbatim if it has any.
2. Write one sentence in the form: "After this PR, <who> can <do what> / <what> behaves as <new behavior> instead of <old behavior>." Use only facts stated in the description or issue. Do not infer goals the author did not state.
3. List `acceptance_criteria` as observable facts, each checkable by a test or a command, for example "GET /orders?status=open returns only open orders".
4. List `non_goals` that the description or issue explicitly excludes.
5. If you cannot write the sentence because the description does not say what changes, stop here and produce a single `question` finding asking the author for the intent.

### Output
`intent_statement`.

### Quality Gate
- `intent_statement.sentence` is one sentence and names a behavior, not a file.
- Every item in `acceptance_criteria` can be traced to a quoted line of the description or issue.

---

## Phase 2: Classify Every Changed File

### Entry Criteria
- `intent_statement` exists.

### Actions
1. For each row in `changed_files`, assign one class with this table, top row first match wins:

| Condition | Class |
|---|---|
| File implements or tests an acceptance criterion | in_scope |
| Lockfile, generated code, snapshot, migration or config the in-scope change requires | supporting |
| Pure rename (`R100`) or move that the in-scope change requires | supporting |
| Formatting-only change (no output from `git diff -w` for that file) in a file with no other change | out_of_scope |
| Refactor, dependency bump, or feature not named in `intent_statement` | out_of_scope |
| Cannot tell | question |

2. Check formatting-only files with `git diff -w origin/<base>...<head> -- <file>`; empty output means whitespace only.
3. For each acceptance criterion, name the file and hunk that implements it and the test that checks it. A criterion with no implementing hunk is a missing-work finding. A criterion with no test is passed on to the tests flows as a note.

### Output
Classified file table and the criterion-to-hunk map.

### Quality Gate
- Every row in `changed_files` has exactly one class.
- Every acceptance criterion is mapped to a hunk or recorded as missing.

---

## Phase 3: Record Scope Findings

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Create one finding per issue with this mapping:

| Situation | `proposed_label` |
|---|---|
| Acceptance criterion with no implementing hunk | blocking |
| Out-of-scope behavior change (feature or dependency bump) | blocking, with the fix "move to a separate PR" |
| Out-of-scope formatting or rename only | nit, with the fix "move to a separate PR or commit" |
| File class `question` | question |

2. Write `scope_findings` to `<findings_dir>/prr-intent-scope-check.json` as a JSON array. Each item: `{"flow":"prr-intent-scope-check","category":"scope","file":"<path>","line":null,"evidence":"<quote>","proposed_label":"<label>","fix":"<text>"}`.
3. If `role` is `author`, do not write review comments: copy the classification into the Reviewer notes section of the PR description and move out-of-scope files to a new branch before requesting review.
4. Validate the JSON: `python -m json.tool <findings_dir>/prr-intent-scope-check.json > /dev/null`.

### Output
`scope_findings`.

### Quality Gate
- `python -m json.tool` exits 0 on the findings file.
- Every out-of-scope or missing item from Phase 2 has exactly one finding.

---

## Worked Example

Illustrative. `pr_description`: "Add `status` filter to GET /orders. Closes #311." Issue #311: "Support ?status=open|closed; invalid status returns 400."

- Phase 1: sentence "After this PR, API clients can filter GET /orders by status, and an invalid status returns 400." Criteria: (a) `?status=open` returns only open orders; (b) `?status=bogus` returns 400.
- Phase 2: `api/orders.py` in_scope; `tests/test_orders.py` in_scope; `requirements.txt` bumps `requests` 2.31 to 2.32: out_of_scope; `api/users.py` whitespace only (`git diff -w` empty): out_of_scope. Criterion (b) has no hunk returning 400.
- Phase 3: three findings: blocking "invalid status 400 not implemented", blocking "requests bump unrelated, move to separate PR", nit "whitespace-only change in api/users.py".

---

## Exit Criteria

DONE when the intent sentence and checkable acceptance criteria exist, every changed file is classified, and every gap or unrelated change is a finding in a valid JSON file in `findings_dir`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Description empty or only a ticket number with no tracker access | **Return**: write one `question` finding asking the author to state the behavior change, and stop the review until answered. |
| Phase 1 | Issue and description disagree | **Adjust**: use the issue as the source of acceptance criteria and add a `question` finding quoting both. |
| Phase 2 | Generated file cannot be tied to a source change | **Adjust**: classify as `question` and ask which command regenerated it. |
| Phase 3 | JSON validation fails | **Retry**: rewrite the file; do not hand-edit partial JSON. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
