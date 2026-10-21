# TruffleHog Verified Secret Scan

**One-line description:** Scans full git history (and optionally the hosted GitHub repository with its pull request refs) with TruffleHog v3, whose detectors attempt a live login with each candidate credential, and separates verified live secrets, unverifiable ones, and dead ones by reading the `Verified` and `VerificationError` fields of the JSON output.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.

---

## Outputs

- `trufflehog_report` (object): TruffleHog version, commands run, report path, and one row per unique credential with `DetectorName`, `verified` (true | false | unknown), commit, file, line, timestamp, and the redacted value.

---

## Phase 1: Decide Whether Verification Is Allowed

### Entry Criteria
- `trufflehog --version` prints a 3.x version. Install from github.com/trufflesecurity/trufflehog releases, `brew install trufflehog`, or run the `trufflesecurity/trufflehog` Docker image.

### Actions
1. Understand what verification does: for each candidate, the detector sends the credential to the provider's API (for example an AWS `GetCallerIdentity` call) to see whether it authenticates. That is network traffic carrying the secret to its own provider, and it appears in the provider's logs.
2. Apply this rule:

| Situation | Mode |
|---|---|
| Repository and scan host may make outbound calls to providers | Verification on (default) |
| Air-gapped host, or policy forbids testing found credentials | Add `--no-verification`; every result is `unknown` and is treated as live |
| Incident response where the provider's logs are evidence | Verification on, and record the scan time so the verification calls can be told apart from attacker use |

3. Confirm the clone is full: `git -C <repo_path> rev-parse --is-shallow-repository` prints `false`; if not, `git fetch --unshallow`.
4. Read `trufflehog git --help` and record which of these flags your version has: `--results`, `--only-verified`, `--fail`, `--json`, `--since-commit`, `--branch`, `--include-paths`, `--exclude-paths`. `--results` (values `verified`, `unknown`, `unverified`, `filtered_unverified`) is newer than `--only-verified`; use whichever exists.

### Output
Verification mode and supported flags recorded.

### Quality Gate
- The mode is chosen from the table and written down with its reason.
- `--is-shallow-repository` printed `false`.

---

## Phase 2: Run The Scans

### Entry Criteria
- Phase 1 complete.

### Actions
1. Local full history, all results, JSON lines:
```
trufflehog git file://<repo_path> --json --no-update > /tmp/trufflehog.jsonl
```
   Use `--results=verified,unknown,unverified` explicitly if your version supports it, so nothing is filtered. `--no-update` stops the binary from self-updating during the scan. Do not add `--only-verified` to this audit run; that hides credentials TruffleHog could not test.
2. Optional, when the repository is hosted on GitHub and a token is available: scan the hosted repository, which includes refs a local clone lacks, such as pull request heads from forks:
```
trufflehog github --repo=https://github.com/<org>/<repo> --json --issue-comments --pr-comments > /tmp/trufflehog-gh.jsonl
```
   Set `GITHUB_TOKEN` in the environment for rate limits. Check `trufflehog github --help` for the comment flags in your version; skip them if absent.
3. Record exit codes. With `--fail`, exit code 183 means results were found; without `--fail`, 0 means the scan completed (findings or not). Any other code is a tool error.

### Output
One or two JSON lines files.

### Quality Gate
- Every line parses: `jq -c . /tmp/trufflehog.jsonl > /dev/null` exits 0.
- The scan log line `finished scanning` (or the version's equivalent summary with `chunks` and `bytes`) is present in stderr.

---

## Phase 3: Read And Classify Results

### Entry Criteria
- Output parses.

### Actions
1. Each line is one result. Key fields: `DetectorName`, `Verified` (bool), `VerificationError` (present when verification was attempted and failed for a reason other than "invalid", such as a network error), `Raw` (the secret; treat as sensitive), `Redacted` (detector-specific safe form, may be empty), `SourceMetadata.Data.Git.commit`, `.file`, `.line`, `.email`, `.timestamp`, `ExtraData` (for example AWS account ID, ARN).
2. Classify each result:

| Fields | `verified` |
|---|---|
| `Verified: true` | true (live credential, highest priority) |
| `Verified: false` and `VerificationError` present, or scan used `--no-verification` | unknown (treat as live) |
| `Verified: false`, no `VerificationError` | false (provider rejected it; may be revoked, or a fake) |

3. Deduplicate by credential, not by commit: group on `DetectorName` + a SHA-256 of `Raw` computed locally (`jq -r '.Raw' | sha256sum`), so the secret itself is not stored in the report. Keep the earliest timestamp as `first_seen`.
4. Build each output row from fields other than `Raw`: detector, verified, first commit, file, line, timestamp, `Redacted` or the first 4 characters of `Raw` followed by `...`, and `ExtraData` (account IDs help identify the owner).
5. Delete the raw `.jsonl` files when the report is built, or move them to an encrypted location; they contain full secrets.

### Output
`trufflehog_report`.

### Quality Gate
- Every line of the `.jsonl` maps to exactly one grouped row (sum of group sizes equals `wc -l /tmp/trufflehog.jsonl`).
- `trufflehog_report` contains no `Raw` field (`jq 'paths | select(.[-1]=="Raw")'` on it returns nothing).
- `ls /tmp/trufflehog*.jsonl` shows the raw files are gone or moved.

---

## Common Mistakes To Avoid

- Do not read `Verified: false` as "safe". It means the provider rejected it at scan time; the credential may have been valid while public, so the leak still needs the rotation flow's log review.
- Do not run only `--only-verified` and call the repo clean; detectors without verification support never return verified results.
- Do not paste `Raw` values into tickets, chat or commit messages.
- Do not invent detector names; copy `DetectorName` from the output.

---

## Worked Example

Illustrative. `repo_path=/srv/billing`, TruffleHog 3.8x, verification allowed.

```
$ trufflehog git file:///srv/billing --json --no-update --results=verified,unknown,unverified > /tmp/trufflehog.jsonl
... finished scanning {"chunks": 21877, "bytes": 48211033, "verified_secrets": 1, "unverified_secrets": 2}
$ jq -r '[.DetectorName, (.Verified|tostring), .SourceMetadata.Data.Git.file, .SourceMetadata.Data.Git.commit[0:10]] | @tsv' /tmp/trufflehog.jsonl
Stripe   true   src/stripe.ts        41aa07c3d9
AWS      false  deploy/old.sh        9f3c1a2b7e
Slack    false  docs/runbook.md      77be01f2c4
```
AWS row has `VerificationError` absent and `ExtraData.account` set: provider rejected it (verified false). Stripe is verified live and goes first to rotation.

---

## Exit Criteria

DONE when full history was scanned in a recorded verification mode, every result is classified true, unknown or false, the report holds no raw secrets, and raw output files are removed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Policy forbids verification | **Adjust**: use `--no-verification`; classify all as unknown. |
| Phase 2 | `unknown flag: --results` | **Adjust**: older version; drop it (default output then includes unverified results) and record the version. |
| Phase 2 | GitHub scan rate limited | **Retry**: set `GITHUB_TOKEN` and rerun. |
| Phase 3 | Many `VerificationError` rows | **Adjust**: network egress is blocked; treat them as unknown and record the blocked domains from the error text. |
| Phase 3 | A verified secret belongs to a third party (vendor key in a copied snippet) | **Return**: still pass it to rotation; notify the owner identified by `ExtraData`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
