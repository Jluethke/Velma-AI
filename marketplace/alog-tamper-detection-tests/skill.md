# Tamper Detection Test Suite

**One-line description:** Build a test suite that applies each tamper action to a known-good log and asserts the verifier flags it with the right exit status and location, proving detection rather than assuming it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `verifier_spec` (object, required): The checks and exit statuses the tests assert against.
- `record_schema` (object, required): The record fields the tests mutate to simulate tampering.
- `rotation_procedure` (object, required): The segment layout so segment-level tampers (dropped or reordered segment) are tested too.
- `repo_path` (string, required): Path to the repository where the tamper test suite is written and run.
- `stack` (string, required): The language of the verifier under test (for example python or go), so the suite invokes the matching CLI.

---

## Outputs

- `tamper_test_suite` (object): The list of tamper cases, the expected verifier result for each, and the run result showing every case detected.

---

## Phase 1: Enumerate the tamper cases

### Entry Criteria
- `verifier_spec` and `record_schema` are present.
- A verifier CLI exists for `stack`.

### Actions
1. Build a known-good log fixture with a genesis record, several records, at least one signed checkpoint, and a rotation boundary per `rotation_procedure`.
2. Enumerate one case per tamper action, each a copy of the good log with one change: edit a payload field in a past record; change a `content_hash`; delete a record (seq gap); insert a back-dated record; reorder two records; truncate the tail below the last checkpoint; forge a checkpoint signature; drop a whole segment; reorder two segments.
3. For each case, write the expected verifier result from `verifier_spec`: the exit status class and the first failure location (which `seq` or segment).
4. Do NOT weaken or delete any of these cases to get a green suite; a case that fails to be detected is a real gap in the verifier, not a test to remove.

### Output
A table of tamper cases each mapped to an expected exit status and location.

### Quality Gate
- There is at least one case per tamper action, including segment-level cases.
- Each case changes exactly one thing from the good log.
- Each case has an expected exit status and first failure location from `verifier_spec`.

---

## Phase 2: Run and confirm every case is caught

### Entry Criteria
- The tamper cases exist with expected results.

### Actions
1. Run the `stack` verifier CLI on the known-good log first and assert exit status 0, so the fixture itself is valid before testing failures.
2. Run the verifier on each tampered log and assert the actual exit status and first failure location match the expected values from the case table.
3. Add one false-positive guard: make a change that is NOT a tamper (for example re-pretty-print a copy that is then re-canonicalized identically) and assert the verifier still returns 0, so canonicalization is not over-flagging.
4. Run the full suite and read the output; record each case, its expected result, and its actual result in `tamper_test_suite`. Every tamper case must be detected and the good log must pass.

### Output
`tamper_test_suite` with every tamper case detected and the good log passing.

### Quality Gate
- The known-good log returns exit status 0 before any tamper case runs.
- Every tamper case produces its expected exit status and first failure location.
- The false-positive guard returns 0, confirming no over-flagging.

---

## Worked Example

Input (illustrative): `stack` = python, verifier CLI present.

Phase 2 run (illustrative):

```
good.log                 exit 0  expected 0   OK
edit payload seq 12      exit 2  expected 2   OK (first_failure seq 12)
delete seq 20            exit 2  expected 2   OK (seq gap 19->21)
truncate tail            exit 2/3 expected per spec OK (below checkpoint seq)
forge checkpoint sig     exit 3  expected 3   OK
drop segment seg-000     exit 2  expected 2   OK (gap reported)
re-canonicalize (no-op)  exit 0  expected 0   OK (no false positive)
```

`tamper_test_suite` records all cases detected and the good and no-op logs passing.

---

## Exit Criteria

DONE when every tamper case (edit, hash change, delete, insert, reorder, truncate, forged signature, dropped and reordered segment) is detected with the expected status and location, the good log passes, and the no-op guard passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A tamper action has no test case | **Adjust**: add a case for it; an untested action is an unproven detection. |
| Phase 2 | A tamper case is not detected (verifier returns 0) | **Stop**: this is a verifier gap; fix the verifier, do not remove the case. |
| Phase 2 | The no-op guard is flagged as tamper | **Retry**: canonicalization is over-flagging; align the verifier canonical form with the writer before proceeding. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
