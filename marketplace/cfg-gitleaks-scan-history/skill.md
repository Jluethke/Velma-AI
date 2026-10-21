# Gitleaks Full History Scan

**One-line description:** Scans every commit on every ref of a git repository with gitleaks v8 using redacted JSON output, plus a separate scan of the current working tree including untracked files, and reads the report fields (RuleID, File, Commit, StartLine, Fingerprint, Date) into a deduplicated finding list.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.

---

## Outputs

- `gitleaks_report` (object): Paths of the raw JSON reports, the gitleaks version, the exact commands run, and a deduplicated finding list (one row per Fingerprint) with RuleID, File, Commit, StartLine, Date, Author and the redacted Match.

---

## Phase 1: Prepare A Complete Clone

### Entry Criteria
- `gitleaks version` prints a v8 version. If not installed: `brew install gitleaks`, or download a release binary from github.com/gitleaks/gitleaks/releases, or run `docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest ...`. Record the version.

### Actions
1. Confirm the clone has full history: `git -C <repo_path> rev-parse --is-shallow-repository` must print `false`. If `true`, run `git -C <repo_path> fetch --unshallow`.
2. Fetch every remote ref so branches that were never checked out are scanned: `git -C <repo_path> fetch --all --tags --prune`.
3. Count what will be scanned: `git -C <repo_path> rev-list --all --count`. Record the number.
4. Check the gitleaks command set for the installed version: `gitleaks --help`.
   - v8.19.0 and later: `gitleaks git` scans history, `gitleaks dir` scans files. `detect` and `protect` still work but are deprecated.
   - Before v8.19.0: `gitleaks detect` scans history, `gitleaks detect --no-git` scans files.
   Use the commands for your version below. Do not mix flags from both.
5. Check for a repo config: `ls <repo_path>/.gitleaks.toml <repo_path>/.gitleaksignore`. If a `.gitleaks.toml` exists, gitleaks uses it automatically from the scan root; record its allowlists, because they hide findings. For this full audit, also run once with `--config` pointing at a file that contains only `[extend]\nuseDefault = true` so repo allowlists cannot hide a real leak.

### Output
Full clone, commit count, version and command set recorded.

### Quality Gate
- `git rev-parse --is-shallow-repository` prints `false`.
- The recorded commit count is greater than 0.

---

## Phase 2: Run The Scans

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. History scan, all refs, redacted, JSON (v8.19+):
```
gitleaks git --log-opts="--all" --redact --report-format json --report-path /tmp/gitleaks-history.json -v <repo_path>
```
   Older v8: `gitleaks detect --source <repo_path> --log-opts="--all" --redact --report-format json --report-path /tmp/gitleaks-history.json -v`.
   `--log-opts` passes options to `git log`; `--all` includes every branch and tag. `--redact` replaces secrets in output with `REDACTED`. Write reports outside the repository.
2. Working tree scan (catches untracked files such as a stray `.env` or `credentials.json` that history cannot see):
```
gitleaks dir --redact --report-format json --report-path /tmp/gitleaks-dir.json -v <repo_path>
```
   Older v8: `gitleaks detect --no-git --source <repo_path> --redact --report-format json --report-path /tmp/gitleaks-dir.json`.
3. Record the exit code of each run with `echo $?`. Exit code 0 means no leaks; 1 means leaks found (the default `--exit-code` is 1); any other non-zero value is a tool error.
4. If the repo has a `.gitleaks.toml`, run step 1 again with `--config /tmp/gitleaks-default.toml` (the `useDefault` file from Phase 1) to `/tmp/gitleaks-history-noallow.json`, and diff the finding counts.

### Output
Two or three JSON report files.

### Quality Gate
- Each run's exit code is 0 or 1. Any other code is a failed scan, not a clean result.
- Each report file exists and parses: `jq length /tmp/gitleaks-history.json` prints a number.

---

## Phase 3: Read And Deduplicate The Report

### Entry Criteria
- Reports parse as JSON.

### Actions
1. Each report is a JSON array. Fields per finding: `RuleID`, `Description`, `File`, `StartLine`, `EndLine`, `Match`, `Secret` (redacted with `--redact`), `Commit`, `Author`, `Email`, `Date`, `Message`, `Entropy`, `Fingerprint`, `Tags`.
2. Summarize by rule: `jq -r '.[].RuleID' /tmp/gitleaks-history.json | sort | uniq -c | sort -rn`.
3. List each finding compactly: `jq -r '.[] | [.RuleID, .File, (.StartLine|tostring), .Commit[0:10], .Date] | @tsv' /tmp/gitleaks-history.json`.
4. Deduplicate: the same secret committed in one commit and still present in 40 later commits appears once per commit where it was added or changed, but the same file and rule across commits usually means one credential. Group by `RuleID` + `File`, keep the earliest `Date` as `first_seen` and the latest commit where it still exists. `Fingerprint` (`commit:file:rule:line`) identifies a single occurrence and is what `.gitleaksignore` accepts.
5. For each group, decide whether the secret is still in the current tree from the working tree report: `in_head: true` when `/tmp/gitleaks-dir.json` has a finding with the same `RuleID` and `File` (`jq -r '.[] | [.RuleID, .File] | @tsv' /tmp/gitleaks-dir.json`), else `false`. Do not search for the secret by pasting it into a terminal; shell history keeps it.
6. Emit `gitleaks_report` with the commands, version, exit codes, report paths, and grouped findings.

### Output
`gitleaks_report`.

### Quality Gate
- The number of grouped findings plus duplicates equals `jq length` of the report (every raw finding is accounted for).
- No unredacted secret appears in `gitleaks_report` (search it for `REDACTED`; secrets were never printed in full).

---

## Common Mistakes To Avoid

- Do not run without `--log-opts="--all"` and call the repo clean; the default scans only commits reachable from HEAD, so other branches and tags are skipped.
- Do not scan a shallow CI clone (`fetch-depth: 1`) and call history clean.
- Do not treat exit code 1 as a crash; it means leaks were found.
- Do not run without `--redact` when output goes to CI logs, tickets or chat.
- Do not trust a repo `.gitleaks.toml` allowlist during an audit; someone may have allowlisted a real secret.

---

## Worked Example

Illustrative. `repo_path=/srv/billing`, gitleaks v8.21.

```
$ git -C /srv/billing rev-parse --is-shallow-repository
false
$ git -C /srv/billing rev-list --all --count
1842
$ gitleaks git --log-opts="--all" --redact --report-format json --report-path /tmp/gitleaks-history.json -v /srv/billing
...
10:14AM INF 1842 commits scanned.
10:14AM WRN leaks found: 3
$ echo $?
1
$ jq -r '.[] | [.RuleID, .File, (.StartLine|tostring), .Commit[0:10], .Date] | @tsv' /tmp/gitleaks-history.json
aws-access-token   deploy/old.sh       12  9f3c1a2b7e  2023-04-11T09:12:44Z
stripe-access-token src/stripe.ts      2   41aa07c3d9  2024-02-02T16:40:10Z
generic-api-key    tests/fixtures/a.json 8 c0de55aa01  2024-05-19T11:03:27Z
```
Grouped: 3 findings; `src/stripe.ts` has `in_head: true`.

---

## Exit Criteria

DONE when all refs of a full clone and the working tree were scanned with redaction, exit codes were 0 or 1, and every raw finding is grouped into `gitleaks_report` with first-seen date and in-HEAD status.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Shallow clone cannot be unshallowed (no remote access) | **Stop**: get a full clone; a partial scan cannot clear history. |
| Phase 2 | Unknown command `git` | **Adjust**: the installed gitleaks is older than v8.19; use the `detect` form. |
| Phase 2 | Exit code other than 0 or 1 | **Retry**: read the error line (bad config, unreadable path); fix and rerun. |
| Phase 2 | Scan very slow on a huge repo | **Adjust**: keep `--all`; add `--max-target-megabytes` (check `--help`) to skip large blobs, and record that blobs above the limit were not scanned. |
| Phase 3 | Hundreds of findings from one test directory | **Return**: pass to `cfg-triage-secret-findings`; do not allowlist here. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
