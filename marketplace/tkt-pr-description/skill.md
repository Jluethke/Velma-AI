# Pull Request Description and Creation

**One-line description:** Pushes the branch with upstream tracking and opens a pull request (GitHub `gh pr create` or GitLab `glab mr create`) whose title follows the commit convention and whose body fills the repo's template, or a standard template, with the ticket link, behavior change, acceptance criteria checklist, exact test commands with results, risk and rollback.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `commit_log` (object[], required): Output of `tkt-conventional-commit`.
- `acceptance_criteria` (object[], required): Output of `tkt-acceptance-criteria-gwt`.
- `verification_log` (object[], required): Output of `tkt-small-edit-loop`.
- `impact_list` (object[], required): Output of `tkt-change-impact-list`.
- `ticket_id` (string, required): Tracker key.
- `branch_name` (string, required): Output of `tkt-branch-create`.

---

## Outputs

- `pr_url` (string): URL and number of the created pull request.
- `pr_body` (string): The exact body text submitted.

---

## Phase 1: Draft the Body

### Entry Criteria
- `commit_log` validated; static checks passed.

### Actions
1. Load the template if the repo has one: `.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `docs/pull_request_template.md`, a file in `.github/PULL_REQUEST_TEMPLATE/`, or for GitLab `.gitlab/merge_request_templates/*.md`. Keep every heading and checkbox from the template; fill each one.
2. If there is no template, use these sections in this order:
```
## Summary
<one paragraph: the behavior change, in user terms>

## Ticket
<link to ticket_id>

## Changes
- <one bullet per logical commit, from commit_log>

## Acceptance criteria
- [x] AC1 <scenario title> - covered by <test id>
- [x] AC2 ...

## How to test
<exact commands, copied from verification_log, with their summary lines>
<manual steps if any criterion needs them>

## Risk and rollback
<HIGH rows from impact_list and their mitigation; how to roll back>

## Breaking changes
<none, or the BREAKING CHANGE text from the commit footer>
```
3. Fill "How to test" only with commands that were actually run and their copied summary lines from `verification_log` and the static check reports. Do not write "all tests pass" without the command and its output line.
4. Check a box only when a test or recorded output proves it. Leave a box unchecked and say why if not proven.
5. Rollback for a code-only change: "revert the merge commit". For HIGH-DATA rows, describe the down migration or state that it is not reversible, as recorded in `impact_list`.
6. Link the ticket in the form the tracker integration recognizes (Jira key in the title or branch, `Closes #123` in the body for GitHub issues to auto-close on merge into the default branch).

### Output
Draft `pr_body`.

### Quality Gate
- Every acceptance criterion id appears in the body with a checkbox.
- Every command in "How to test" also appears in `verification_log` or a static check report.

---

## Phase 2: Title, Push and Create

### Entry Criteria
- Body drafted.

### Actions
1. Title: if the repo squash-merges, the title becomes the commit subject on the base branch, so it must follow the commit convention, for example `feat(export): add currency column and status filter to invoice CSV export`. Include the ticket key if the repo's recent PR titles do (`gh pr list --state merged --limit 20 --json title`).
2. Push with upstream tracking: `git push -u origin <branch_name>`. If you rewrote already-pushed commits, use `git push --force-with-lease origin <branch_name>`; never plain `--force`.
3. Write the body to a file and create the PR:
   - GitHub: `gh pr create --base <base> --head <branch_name> --title "<title>" --body-file <file>`. Add `--draft` if CI is still running or the team opens drafts first. Add `--reviewer <user-or-team>` only for people named by CODEOWNERS or the ticket; CODEOWNERS reviewers are requested automatically.
   - GitLab: `glab mr create --source-branch <branch_name> --target-branch <base> --title "<title>" --description "$(cat <file>)"`. Check `glab mr create --help` for your version's flags.
4. Read the PR back: `gh pr view --json url,number,title,baseRefName,headRefName` and confirm base and head.
5. Check the diff GitHub shows matches the local one: `gh pr diff --name-only` against `git diff --name-only origin/<base>...HEAD`.

### Output
`pr_url`, `pr_body`.

### Quality Gate
- `gh pr view --json baseRefName,headRefName` shows the intended base and `branch_name`.
- `gh pr diff --name-only` lists the same files as `git diff --name-only origin/<base>...HEAD`.

---

## Worked Example

Illustrative only.

```
$ git push -u origin feat/PAY-412-invoice-csv-export
branch 'feat/PAY-412-invoice-csv-export' set up to track 'origin/feat/PAY-412-invoice-csv-export'.
$ gh pr create --base develop --head feat/PAY-412-invoice-csv-export \
    --title "feat(export): add currency column and status filter to invoice CSV export (PAY-412)" \
    --body-file pr_body.md
https://github.com/acme/billing/pull/1907
```

`pr_body` excerpt:
```
## Acceptance criteria
- [x] AC1 Export returns CSV - tests/api/test_export.py::test_export_returns_csv
- [x] AC3 Export respects the active status filter - tests/api/test_export.py::test_export_respects_status_filter
## How to test
uv run pytest -m integration tests/api/test_export.py   -> 5 passed in 1.12s
uv run mypy src                                          -> Success: no issues found in 87 source files
## Risk and rollback
openapi.yaml adds an optional query parameter (HIGH-CONTRACT, backward compatible). Roll back by reverting the merge commit.
```

---

## Exit Criteria

DONE when the branch is pushed with upstream tracking, the PR exists against the intended base, the body fills every template section with proven claims only, and the PR diff matches the local diff.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Template asks for something not available (screenshots, perf numbers) | **Adjust**: produce it if the ticket is UI or performance work; otherwise write "not applicable" with the reason. |
| Phase 2 | Push rejected (non-fast-forward) | **Stop**: someone pushed to the branch; fetch and inspect with `git log HEAD..origin/<branch_name>` before any force push. |
| Phase 2 | `gh` not authenticated | **Stop**: ask the user to run `gh auth login`; never paste tokens into commands. |
| Phase 2 | PR diff contains unexpected files | **Return**: the base is wrong or the branch carries extra commits; go to `tkt-sync-strategy-choose`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
