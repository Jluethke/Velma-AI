# Quarantine Flaky Go Tests With -skip and a Separate Run

**One-line description:** Quarantines confirmed flaky Go tests by excluding them from the blocking `go test` run with the `-skip` regex flag (Go 1.20 and later), running them alone with `-run` in a non-blocking CI job, and tracking each in an issue.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository checkout.
- `flaky_tests` (object[], required): From `ci0-flaky-detect-junit`; only `confirmed: true` entries.
- `ci_platform` (string, required): `github` or `gitlab`.

---

## Outputs

- `quarantine_record` (object): `{marked_tests: [{test_id, package, issue_url}], skip_regex, blocking_count_before, blocking_count_after, quarantine_job_name, diff}`.

---

## Phase 1: Build the Regex

### Entry Criteria
- `go version` prints go1.20 or later (`-skip` was added in Go 1.20). For older Go, see Error Handling.

### Actions
1. For each confirmed test, take the top-level test function name, for example `TestExportCSV`. For a subtest use `TestExportCSV/rounding`; `-skip` and `-run` split on `/` and match each level.
2. Anchor every name: `^TestExportCSV$`. Unanchored `TestExport` would also skip `TestExportJSON`.
3. Combine names with `|`: `-skip '^(TestExportCSV|TestLeaseRenewal)$'`.
4. Put the regex in one place: a file `quarantine.txt` with one anchored name per line, plus `QUARANTINE_RE=$(paste -sd'|' quarantine.txt)` in CI. Keep `quarantine.txt` sorted.
5. Count before: `go test -list '.*' ./... | grep -c '^Test'`.

### Output
`skip_regex` and `quarantine.txt`.

### Quality Gate
- Every line in `quarantine.txt` starts with `^` and ends with `$`.
- `go test -list "$QUARANTINE_RE" ./... | grep -c '^Test'` equals the number of confirmed top-level tests.

---

## Phase 2: Track and Annotate

### Entry Criteria
- Regex built.

### Actions
1. Create one issue per test (`gh issue create` or `glab issue create`) with failure messages and rerun counts.
2. Add a comment directly above each test function: `// Quarantined: <issue URL> (excluded by quarantine.txt)`.
3. Do not add `t.Skip()` in the test body. A code-level skip hides the test in every run including the quarantine job. Do not delete or rename the test.
4. Run `gofmt -l .` after editing; it must print nothing.

### Output
Annotated tests and issues.

### Quality Gate
- `grep -rn 'Quarantined:' --include='*_test.go' . | wc -l` equals the number of quarantined tests.
- `gofmt -l .` prints nothing.

---

## Phase 3: Split CI Jobs

### Entry Criteria
- Tests annotated.

### Actions
1. Blocking job: `QUARANTINE_RE=$(paste -sd'|' quarantine.txt); go test -race -count=1 ${QUARANTINE_RE:+-skip "($QUARANTINE_RE)"} ./...`. The `${VAR:+...}` form adds `-skip` only when the file is non-empty.
2. Quarantine job (non-blocking: GitHub `continue-on-error: true` and not in the aggregate check's `needs`; GitLab `allow_failure: true`): `test -s quarantine.txt && go test -race -count=1 -run "($(paste -sd'|' quarantine.txt))" ./... || echo "no quarantined tests"`. Wrap with gotestsum `--junitfile reports/quarantine.xml` if JUnit is used.
3. Check counts locally: blocking `go test -list '.*' ./... ` minus skipped equals before minus quarantined. Note: `-list` does not apply `-skip`; verify the blocking job's JUnit case count in CI instead.
4. Lint the CI file and push.

### Output
`quarantine_record`.

### Quality Gate
- In the CI run, the blocking job's JUnit has no case named in `quarantine.txt`: `grep -E -c 'name="(TestExportCSV|...)"' <blocking junit>` prints 0.
- The quarantine job ran and its report lists every quarantined test.

---

## Worked Example

Illustrative only. Go 1.23; confirmed `TestLeaseRenewal` in `internal/lock`.

Phase 1: `quarantine.txt` contains `^TestLeaseRenewal$`. `go test -list '^TestLeaseRenewal$' ./...` prints `TestLeaseRenewal` and `ok  example.com/svc/internal/lock`.
Phase 2: issue #233; comment added.
Phase 3: blocking JUnit contains 0 `TestLeaseRenewal` cases; quarantine job report shows `TestLeaseRenewal` failed 1 of 1 (allowed). Pipeline green.

---

## Exit Criteria

DONE when confirmed flaky tests are excluded from the blocking job by an anchored `-skip` regex from one file, run in a non-blocking job, and each links to an issue.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Go older than 1.20 (`flag provided but not defined: -skip`) | **Adjust**: use a build-tag file pair or an env check calling `t.Skip` only when `QUARANTINE_EXCLUDE=1`, and record that upgrading Go removes the workaround. |
| Phase 1 | Same test name in two packages | **Adjust**: run the blocking job per package with package-specific regexes, or accept both are excluded and record it. |
| Phase 3 | Quarantined test still appears in blocking JUnit | **Stop**: the regex is not anchored or the subtest path is wrong; fix. |
| Phase 3 | Empty `quarantine.txt` makes `-run "()"` match all | **Stop**: the `test -s` guard is missing; add it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
