# PR Secrets Scan with Gitleaks

**One-line description:** Scans every commit in the PR range, not only the final diff, with Gitleaks and redacted output, reads each hit's rule, file, commit and entropy, separates real credentials from test fixtures, and treats any real secret as blocking with rotation required because deleting it in a later commit leaves it in history.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone path.
- `base_branch` (string, required): PR target branch.
- `head_sha` (string, required): PR head commit.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `secret_findings` (object[]): Confirmed or suspected secrets with rule, commit, file and line (values redacted), written to `<findings_dir>/prr-gitleaks-secrets-scan.json`.

---

## Phase 1: Scan the Commit Range

### Entry Criteria
- `gitleaks version` prints a v8 version. Install from the official releases if missing; do not use an unofficial fork.

### Actions
1. Compute the range: `MB=$(git -C <repo_dir> merge-base origin/<base_branch> <head_sha>)`.
2. Scan every commit in the range, so a secret added in commit 2 and deleted in commit 5 is still found. Gitleaks v8.19 and later use the `git` subcommand; earlier v8 releases use `detect`. Check `gitleaks --help` and use the one listed:
   - v8.19+: `gitleaks git --log-opts="$MB..<head_sha>" --redact --report-format json --report-path ../gitleaks.json <repo_dir>`
   - earlier v8: `gitleaks detect --source <repo_dir> --log-opts="$MB..<head_sha>" --redact --report-format json --report-path ../gitleaks.json`
3. Always pass `--redact` so secret values never appear in the report or in review comments.
4. Exit code 0 means no leaks; exit code 1 (the default `--exit-code`) means leaks found; other codes mean an error.
5. Keep the report outside the repository (`../gitleaks.json`) so it is never committed.

### Output
`../gitleaks.json` and the exit code.

### Quality Gate
- The exit code is 0 or 1 and recorded; any other code goes to Error Handling.
- `../gitleaks.json` exists and parses with `python -m json.tool ../gitleaks.json`.

---

## Phase 2: Audit Gitleaks Configuration Changes

### Entry Criteria
- Phase 1 complete.

### Actions
1. Check whether the PR weakens the scanner: `git diff $MB..<head_sha> -- .gitleaks.toml .gitleaksignore`.
2. Apply this table:

| Change in the PR | Label |
|---|---|
| New line in `.gitleaksignore` (a fingerprint `commit:file:rule:line`) | question: ask what the value is and why it is safe |
| New `[allowlist]` path or regex in `.gitleaks.toml` covering source directories | blocking |
| Allowlist limited to test fixtures directory with fake values | none |
| Rule disabled or removed | blocking |

3. Also search added lines for inline allow comments: `git diff -U0 $MB..<head_sha> | grep -n 'gitleaks:allow'`. Each hit is a `question`.

### Output
Config-change notes.

### Quality Gate
- Both the config diff and the inline-allow grep were run, with output (or "none") recorded.

---

## Phase 3: Classify Hits and Record Findings

### Entry Criteria
- Phase 1 report parsed.

### Actions
1. For each report item read `RuleID`, `File`, `StartLine`, `Commit`, `Entropy`, `Fingerprint`, and `Match` (redacted).
2. Classify with this table:

| Evidence | Class | Label |
|---|---|---|
| Provider-specific rule (for example `aws-access-token`, `github-pat`, `slack-bot-token`, `stripe-access-token`, `private-key`) in any file | real | blocking |
| `generic-api-key` in source or config outside test fixtures | suspected real | blocking unless the author shows it is a placeholder |
| Hit in a test fixture with an obviously fake value (documented example key such as AWS's `AKIAIOSFODNN7EXAMPLE`) | fake | none; suggest a `gitleaks:allow` comment with a reason |
| Hit in a commit that a later PR commit deletes | real | blocking: it is still in history |

3. For every real or suspected secret, the fix text is fixed and ordered: (1) revoke and rotate the credential at the provider now, (2) remove it from the code and load it from the secret store or environment, (3) rewrite branch history only if the PR is unmerged and the team allows force-push; rotation is required regardless, because the value has already been pushed to the forge.
4. Never paste the secret value into a comment, even partially. Refer to it by rule, file, line and commit.
5. Write `<findings_dir>/prr-gitleaks-secrets-scan.json` (fields `flow`, `category`="secrets", `file`, `line`, `evidence` = rule ID, commit and fingerprint, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`secret_findings`.

### Quality Gate
- Every `Secret` field in `../gitleaks.json` is `REDACTED` and every `Match` field shows `REDACTED` in place of the value (check with `grep -E '"(Match|Secret)"' ../gitleaks.json`), and no finding quotes a secret value.
- Every report item has a class.

---

## Worked Example

Illustrative. PR range has three commits.

- Phase 1: `gitleaks git --log-opts="7c1d2e3..9f3c1e0" --redact --report-format json --report-path ../gitleaks.json .` exits 1. Report item: `RuleID: aws-access-token`, `File: deploy/settings.py`, `StartLine: 12`, `Commit: 4a5b6c7`, `Match: "REDACTED"`.
- Phase 2: `.gitleaksignore` gained one fingerprint for `tests/fixtures/keys.pem`: question.
- Phase 3: the final diff no longer contains the key (commit 9f3c1e0 removed it), but commit 4a5b6c7 still holds it: blocking, fix "rotate the AWS key now, load it from the environment, then remove it from history if allowed".

---

## Exit Criteria

DONE when every commit in the PR range was scanned with redaction, scanner configuration changes were audited, and every hit is classified with real secrets recorded as blocking with rotation in the fix.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Exit code other than 0 or 1 | **Retry**: run with `--verbose` and fix the reported error (often a bad `--log-opts` range). |
| Phase 1 | Shallow clone hides the merge base | **Adjust**: run `git fetch --unshallow` or `git fetch --deepen=<n>` and rerun. |
| Phase 3 | Unsure whether a value is real | **Adjust**: treat it as real and blocking; ask the author to confirm it is a placeholder. |
| Phase 3 | Secret belongs to a third party | **Return**: escalate to the security contact named in `SECURITY.md`; do not test the credential. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
