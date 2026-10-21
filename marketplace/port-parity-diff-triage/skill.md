# Port Parity Diff Triage

**One-line description:** Runs the full golden replay on the finished (or blocked) port, classifies every non-passing record with a decision table into port bug, corpus defect, environment difference, source undefined behavior, or proposed intended divergence, and produces a parity report whose numbers come from the replay output, with every intended divergence requiring the user's written approval.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `module_port_log` (object[], required): Output of `port-module-port-loop`.
- `golden_corpus` (object, required): Output of `port-golden-corpus-freeze`.
- `corpus_schema` (object, required): Output of `port-golden-corpus-schema`.
- `porting_rulebook` (object, required): Output of `port-porting-rulebook`; supplies the full replay and checksum commands.

---

## Outputs

- `parity_report` (object): Totals from the replay (`records`, `passed`, `failed`, `skipped`, `ub`), per-behavior pass rates, the checksum result, the list of approved intended divergences with approval text, and the replay command and commit it ran on.
- `port_defects` (object[]): Every record classified as a port bug, with id, diff, suspected rule, and the unit to reopen. Empty when none.

---

## Phase 1: Run Everything Once

### Entry Criteria
- `module_port_log` exists; `git status --porcelain` in the target is empty.

### Actions
1. Record `git rev-parse HEAD` of the target.
2. Run the checksum command from the rulebook. If it fails, stop: results against a modified corpus are meaningless.
3. Run the full replay command (both profiles for Rust) and save the raw output to a file outside the repo: for example `go test ./internal/golden/ -run TestGolden -count=1 -v > /tmp/replay.txt 2>&1`.
4. Extract counts from the raw output only:
   - Go: `grep -c -- "--- PASS: TestGolden/" replay.txt`, same for `FAIL` and `SKIP`.
   - Vitest: the summary line `Tests  N passed | M failed | K todo`; or run with `--reporter=json --outputFile=replay.json` and read `numPassedTests`, `numFailedTests`, `numTodoTests`.
   - Kotlin: `<testsuite ... tests= failures= skipped=>` attributes in the JUnit XML report.
   - Rust: the harness's own `golden: ran= skipped= failed=` line.
5. `skipped` must be zero for a finished port. Any skipped record is an unported behavior; list them.

### Output
Raw output file and counts.

### Quality Gate
- Checksum command exited 0.
- `passed + failed + skipped` equals the corpus record count in `MANIFEST.json`.

---

## Phase 2: Classify Every Failure

### Entry Criteria
- At least one failed or skipped record, else go to Phase 3.

### Actions
1. For each failed record, read its expected and actual encoded values and apply this table. Take the first matching row.

| Evidence | Class | Action |
|---|---|---|
| Record kind is `ub` | `source_ub` | expected behavior is the user's decision; if none recorded, ask |
| Same failure disappears when the replay runs with the capture environment (`TZ`, locale, JDK or Node or ICU version from `ENV.json`) | `environment` | pin the environment in the replay config; not a port change |
| Expected value contains data that varies run to run (timestamp, path, id) and no mask exists | `corpus_defect` | return to `port-nondeterminism-inventory`; recapture as `golden-v2` with a reason |
| Two captures of the source disagree on this record (rerun the capture for this one case twice) | `corpus_defect` | same as above |
| Difference matches a rule in `PORTING_RULES.md` that the port did not apply | `port_bug` | add to `port_defects` with the rule id |
| Difference is in a behavior the source documents as unspecified (iteration order of a set) and `rules.json` lacks `unordered` | `corpus_defect` | add the rule in `golden-v2` |
| The port is arguably more correct (source bug), for example the C source overflows, the Java source compares `Integer` by reference | `proposed_divergence` | write it up for the user: record id, source output, port output, why. It stays failing until approved |
| None of the above | `port_bug` | add to `port_defects` with "no matching rule": a new rule is needed |

2. Never change an expected value to the port's output. A divergence is approved only by the user, in writing, and then recorded in an `approved_divergences.json` file beside the harness (id, reason, approver, date); the comparator reads it and reports these records as `diverged_approved`, not `passed`.
3. For each `port_bug`, name the unit from `module_port_log` that owns the behavior.

### Output
Classification for every failed record; `port_defects`.

### Quality Gate
- Every failed record has exactly one class.
- `port_defects` contains every `port_bug` row, each with a unit and a rule id or "no matching rule".
- No golden file changed: `git diff --name-only <tag> -- <golden dir>` prints nothing.

---

## Phase 3: Write the Report

### Entry Criteria
- Classification complete or no failures.

### Actions
1. Fill `parity_report`: commit, command, counts, per-behavior `passed/total` (from the raw output, grouped by the B-id prefix of each record name), classes with counts, approved divergences, open proposed divergences, and skipped records.
2. Verdict, by rule:

| Condition | Verdict |
|---|---|
| failed = 0, skipped = 0, all divergences approved | `PARITY` |
| any `port_bug` | `NOT_PARITY`: return to `port-module-port-loop` with `port_defects` |
| only `corpus_defect`, `environment`, or unapproved proposals remain | `BLOCKED`: list what the user or a recapture must decide |

3. Do not write "parity achieved" in any summary unless the verdict row says `PARITY`.

### Output
`parity_report`, `port_defects`.

### Quality Gate
- Every number in the report is traceable to a line in the raw replay output.
- The verdict follows the table.

---

## Worked Example

Illustrative. `stack=java-kotlin`, 205 records.
```
$ ./gradlew test --tests "golden.GoldenTest"
$ grep -o 'tests="[0-9]*" skipped="[0-9]*" failures="[0-9]*"' build/test-results/test/TEST-golden.GoldenTest.xml
tests="205" skipped="0" failures="3"
```
Classification:
```
B-021/0007  proposed_divergence  Java compared Integer with ==; qty 200 -> "no match". Kotlin == -> "match". Port keeps === for parity until user decides.
B-014/0002  environment          passes with -Duser.timezone=UTC; Gradle test task lacked jvmArgs. Fixed in build file.
B-009/0031  port_bug             R-IDM-07 (stream laziness): Kotlin map{} ran a logging side effect for all items before filter; use asSequence(). Unit: step 6 OrderPipeline.
```
Verdict: `NOT_PARITY` (one `port_bug`). `port_defects` = [B-009/0031].

---

## Exit Criteria

DONE when the full replay ran on a verified corpus, every failure has one class, port bugs are listed with their units, and the report's verdict follows the table with numbers taken from raw output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Checksum fails | **Stop**: restore the corpus from the tag before anything else. |
| Phase 1 | Replay counts do not add up to the record total | **Adjust**: the harness skips records silently (filter left on, crash mid-run); fix the harness, rerun. |
| Phase 2 | User wants failing records "just marked as passing" | **Stop**: only the approved-divergence file with a reason may change how a record is reported. |
| Phase 3 | Verdict is `NOT_PARITY` | **Return**: to `port-module-port-loop` with `port_defects`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
