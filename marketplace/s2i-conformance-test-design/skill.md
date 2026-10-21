# Conformance Test Design per Requirement

**One-line description:** Designs at least one conformance test per normative requirement, using fixed rules for how many positive and negative cases each keyword level needs (MUST, MUST NOT, SHOULD, MAY), adds tests for every state transition, test vector, registry rule and ambiguity decision, and writes a language-neutral test plan keyed by requirement ID.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `requirements_table` (object[], required): From `s2i-requirements-table`.
- `ambiguity_log` (object[], required): From `s2i-ambiguity-log`.
- `test_vectors` (object, required): From `s2i-test-vectors-extract`.
- `state_machine` (object, optional): From `s2i-state-machine-extract`; absent when the spec has no states.
- `registry_snapshot` (object[], optional): From `s2i-iana-registry-check`.

---

## Outputs

- `conformance_test_plan` (object[]): Rows `{ "test_id", "req_ids", "amb_ids", "kind", "setup", "stimulus", "expected", "oracle", "priority" }`, written to `spec/test_plan.csv` and `.json`.

---

## Phase 1: Tests from Requirements

### Entry Criteria
- `requirements_table` has rows with `applies` set.

### Actions
1. For each row, create tests using this table. A row with `applies` = `no` still gets the "peer violates it" test when your side must detect the violation.

   | `level` | `testability` | Tests to create |
   |---|---|---|
   | MUST | black_box | 1 positive (behavior happens when `condition` holds) and 1 negative (stimulus that would tempt a wrong implementation; expected per `error_behavior`) |
   | MUST_NOT | black_box | 1 test that provokes the forbidden behavior and asserts it does not happen |
   | SHOULD / SHOULD_NOT | black_box | 1 test asserting the recommended behavior; if you deliberately deviate, the test asserts your documented alternative and cites the deviation |
   | MAY | black_box | If implemented: 1 test that it works and 1 that a peer not using it still interoperates. If not implemented: 1 test that the peer's use of it is handled per spec |
   | any | white_box | 1 unit test with internal access (for example inject the random source) |
   | any | review_only | no automated test; a checklist item with the reviewer and evidence file |

2. `test_id` = `T-<req id without REQ->-<nn>`, for example `T-5.1-02-01`.
3. Fill `oracle`: how pass/fail is decided ("connection closed within the read timeout", "frame bytes equal vector V-5.7-01", "Close code == 1002").
4. Never write a test whose expected result is "does not crash" alone for a MUST row; the expected value comes from the spec text.

### Output
Requirement-driven test rows.

### Quality Gate
- Every row with `level` MUST and `testability` black_box has at least two tests (`grep` the plan for its ID).
- Every test has a non-empty `oracle`.

---

## Phase 2: Tests from Vectors, States, Registries and Ambiguities

### Entry Criteria
- Phase 1 rows.

### Actions
1. One test per vector group from `test_vectors` (data-driven over all vectors of the group), `kind` = `vector`.
2. With `state_machine`: one test per filled transition (`kind` = `transition`), and one test per entry in `state_gaps` asserting the decision from the ambiguity log.
3. With `registry_snapshot`: per registry, one test with a registered value, one with an unassigned value, and one per reserved range, each asserting the rule from that flow.
4. One test per ambiguity decision with `status` other than `RESOLVED` (`kind` = `ambiguity`, `amb_ids` filled). These tests document behavior the spec did not fix, so changes are visible.
5. Boundary values: for every numeric field with a spec-stated range (lengths, codes, window sizes), test the minimum, the maximum, one below the minimum and one above the maximum. Use the spec's numbers only.

### Output
Full test row list.

### Quality Gate
- Count of `transition` tests equals the count of filled transitions in `spec/state_machine.csv` (when present).
- Every ambiguity row not `RESOLVED` has a test.

---

## Phase 3: Prioritize and Publish

### Entry Criteria
- Full test list.

### Actions
1. `priority`: `P1` for MUST/MUST_NOT tests and anything touching framing, length fields, authentication or state; `P2` for SHOULD and vectors; `P3` for MAY and ambiguity documentation.
2. Check coverage: every requirement ID with `applies` yes or detection duty appears in at least one test's `req_ids`. List any missing ones and add tests now.
3. Write `spec/test_plan.csv` and `spec/test_plan.json`.

### Output
`conformance_test_plan`.

### Quality Gate
- Script check: the set of `req_ids` across the plan contains every testable applicable requirement ID (print the difference; it must be empty).
- `python -m json.tool spec/test_plan.json` exits 0.

---

## Worked Example

Illustrative. RFC 6455, server.

Phase 1:
```
test_id,req_ids,kind,stimulus,expected,oracle,priority
T-5.1-02-01,REQ-5.1-02,requirement,client sends unmasked text frame,server closes connection,"TCP close observed; if Close sent, code 1002",P1
T-5.1-02-02,REQ-5.1-02,requirement,client sends masked text frame,frame delivered to app,"app receives 'Hello'",P1
T-5.1-03-01,REQ-5.1-03,requirement,app sends text,frame on wire has MASK bit 0,"byte 1 & 0x80 == 0",P1
```
Phase 2: `T-V-5.7` iterates vectors V-5.7-01..; `T-AMB-004-01` sends a Close with a 1-byte payload and expects failure with 1002.

Phase 3: Coverage difference prints an empty set.

---

## Exit Criteria

DONE when every applicable or detection-duty requirement, vector group, transition, registry rule and non-trivial ambiguity decision has at least one test with an oracle, and the plan is published in CSV and JSON.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No observable oracle for a black_box row | **Adjust**: reclassify as white_box and design a unit test; record the change. |
| Phase 1 | `error_behavior` unspecified | **Adjust**: use the ambiguity log decision; if none, **Return** to `s2i-ambiguity-log`. |
| Phase 2 | Spec range has no stated bounds | **Adjust**: test only the stated side; record the missing bound as an ambiguity, do not invent a number. |
| Phase 3 | Coverage difference not empty | **Retry** Phase 1 for the missing IDs before publishing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
