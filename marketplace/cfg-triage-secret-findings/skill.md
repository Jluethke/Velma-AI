# Triage Secret Scan Findings

**One-line description:** Merges gitleaks and TruffleHog results into one list per credential, sorts each into confirmed leak, test fixture, or false positive with a fixed decision table, records exposure facts (first commit, still in HEAD, repository visibility, forks), and writes narrowly scoped allowlist entries (`.gitleaksignore` fingerprints, `[allowlist]` paths) only for non-secrets.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gitleaks_report` (object, required): Output of `cfg-gitleaks-scan-history`.
- `trufflehog_report` (object, required): Output of `cfg-trufflehog-verify-secrets`.
- `repo_path` (string, required): Absolute path to the repository root.

---

## Outputs

- `confirmed_leaks` (object[]): One row per real credential: `id`, `type` (provider and credential kind), `files`, `first_commit`, `first_seen`, `in_head`, `verified` (true | unknown | false), `repo_visibility` (public | internal | private), `exposure_start`, `owner_hint`.
- `allowlist_changes` (object[]): Each proposed allowlist entry: file (`.gitleaksignore` or `.gitleaks.toml`), exact text, the finding it suppresses, and the reason.

---

## Phase 1: Merge Into One Row Per Credential

### Entry Criteria
- Both reports exist (an empty finding list is allowed for either).

### Actions
1. Start from the TruffleHog rows (they are already one per credential). For each gitleaks group, find a TruffleHog row with the same file and a commit in the same history; if found, attach the gitleaks `RuleID` and `Fingerprint` list to it. If not found, add a new row with `verified: unknown`.
2. Give each row an `id` (`L01`, `L02`, ...). Keep the list of all gitleaks fingerprints per row; the allowlist step needs them.
3. Record repository visibility: `gh repo view <org>/<repo> --json visibility,isFork,forkCount` if the GitHub CLI is available, else ask the user. Record `forkCount`; forks keep their own copy of history.
4. For each row, find when it first became visible: `first_seen` is the earliest commit date. If the repository is public, `exposure_start` is the later of `first_seen` and the date the repository was made public (ask the user; GitHub does not show that date in the API). If private, `exposure_start` is `first_seen` and the exposure is limited to everyone with read access since then.

### Output
Merged rows with exposure facts.

### Quality Gate
- Every gitleaks fingerprint and every TruffleHog group is attached to exactly one row (count both and compare).
- Every row has `repo_visibility` and `exposure_start` set, or an open question naming who must answer.

---

## Phase 2: Classify With The Decision Table

### Entry Criteria
- Merged rows exist.

### Actions
1. Apply the rules in order; the first match wins. Do not skip rules and do not decide by appearance.

| Order | Condition | Class |
|---|---|---|
| 1 | `verified: true` | confirmed leak |
| 2 | Value is a provider's documented example (for example AWS `AKIAIOSFODNN7EXAMPLE`, Stripe `sk_test_` keys with `4242` docs values) and appears only in docs or tests | false positive |
| 3 | File is under a test or fixture path AND the value was generated for the test (contains `fake`, `dummy`, `test`, `example`, or is a key the test itself creates) AND no non-test file contains the same value | test fixture |
| 4 | The match is not a credential format at all: a hash in a lockfile (`integrity: sha512-`), a UUID, a public key (`BEGIN PUBLIC KEY`, `ssh-ed25519 AAAA` in `authorized_keys`), a content hash | false positive |
| 5 | Anything else, including "probably old" and "we think it was revoked" | confirmed leak |

2. Rule 5 is deliberate: an unverifiable credential is treated as live until its owner confirms revocation in writing (a provider console screenshot or API output).
3. Live-mode payment keys (`sk_live_`, `rk_live_`), cloud keys (`AKIA`, `ASIA`), private keys (`BEGIN RSA PRIVATE KEY`, `BEGIN OPENSSH PRIVATE KEY`, `BEGIN EC PRIVATE KEY`) are never classified as fixtures, even under `tests/`.
4. For each confirmed leak, set `owner_hint` from TruffleHog `ExtraData` (AWS account ID), the commit author email, or the service named in the file path.

### Output
Each row has a class.

### Quality Gate
- Every row has exactly one class and the rule number that produced it.
- Zero rows matching step 3 prefixes are classed fixture or false positive (`rg` the class list for them).

---

## Phase 3: Write Narrow Allowlist Entries

### Entry Criteria
- Classification complete.

### Actions
1. Only rows classed false positive or test fixture get allowlist entries. Confirmed leaks never do, even after rotation; they leave history through the purge flow or stay visible as a record.
2. Choose the narrowest mechanism:

| Case | Mechanism | Exact form |
|---|---|---|
| One occurrence | `.gitleaksignore` at repo root | One fingerprint per line: `<commit>:<file>:<rule-id>:<line>` (copy `Fingerprint` from the JSON) |
| A whole fixture directory of generated fakes | `.gitleaks.toml` path allowlist | `[extend]` `useDefault = true` then an allowlist with `paths = ['''^tests/fixtures/''']` (gitleaks 8.21+ uses `[[allowlists]]`; older uses `[allowlist]`; check your version's README) |
| A line in source that must stay | inline comment | append `gitleaks:allow` on the same line |
| TruffleHog false positive | exclude file | a file of path regexes passed with `--exclude-paths` |

3. Never allowlist by `RuleID` alone (disables that detector everywhere) and never with a broad regex such as `paths = ['''.*''']`.
4. Write the proposed entries into `allowlist_changes` with the reason. Apply them in a separate commit after review. Then rerun `gitleaks git --log-opts="--all" --redact -v .` and confirm the count dropped by exactly the number of suppressed findings.
5. Emit `confirmed_leaks` sorted with `verified: true` first, then `in_head: true`, then by `exposure_start` (oldest first).

### Output
`confirmed_leaks`, `allowlist_changes`.

### Quality Gate
- Rerun finding count equals previous count minus allowlisted findings (record both numbers).
- No `allowlist_changes` entry refers to a confirmed leak.

---

## Common Mistakes To Avoid

- Do not delete a finding from the report because it is "old". Age is not revocation.
- Do not allowlist a real secret to get CI green. That is the most common way leaks persist.
- Do not try a found credential by hand (logging in with it) to test it; that is unauthorized use. Use TruffleHog verification or ask the owner.
- Do not edit source to remove the secret in this flow. Rotation comes first.

---

## Worked Example

Illustrative. Inputs: gitleaks found 3 groups, TruffleHog found 3 credentials. Repo is public since 2024-01-15, 6 forks.

Phase 1: merged to 3 rows. `gh repo view acme/billing --json visibility,forkCount` gives `{"visibility":"PUBLIC","forkCount":6}`.

Phase 2:
```
L01 Stripe live key   src/stripe.ts        verified=true    rule 1 -> confirmed leak  exposure_start=2024-02-02
L02 AWS access key    deploy/old.sh        verified=false   rule 5 -> confirmed leak  exposure_start=2024-01-15 (first_seen 2023-04-11, repo public later)
L03 generic-api-key   tests/fixtures/a.json "fake_key_for_tests" rule 3 -> test fixture
```
Phase 3: `.gitleaksignore` gets `c0de55aa01...:tests/fixtures/a.json:generic-api-key:8`. Rerun: 3 findings before, 2 after.

---

## Exit Criteria

DONE when every finding belongs to one credential row, each row is classified by a numbered rule, allowlist entries cover only non-secrets with the narrowest mechanism, and `confirmed_leaks` is ordered for rotation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Repository visibility history unknown | **Adjust**: assume `exposure_start = first_seen` (the earliest possible) and record the assumption. |
| Phase 2 | Owner says "already revoked" without proof | **Adjust**: keep it confirmed; ask for the provider output showing the key inactive or deleted. |
| Phase 3 | Rerun count dropped by more than expected | **Stop**: an allowlist entry is too broad; narrow it and rerun. |
| Phase 3 | Zero confirmed leaks | **Return**: emit an empty `confirmed_leaks`; the chain skips rotation and purge. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
