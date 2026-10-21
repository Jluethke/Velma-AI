# Verifier Tool Specification

**One-line description:** Specify exactly what the verifier checks and in what order so every stack-specific verifier is identical: chain continuity, content-hash recompute, signatures, checkpoints, and segment linkage, with one exit status per outcome.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `record_schema` (object, required): The record fields the verifier parses and recomputes.
- `chain_link_spec` (object, required): The linkage and recompute rules the verifier enforces.
- `canonicalization_spec` (object, required): The canonical form the verifier uses before recomputing hashes.
- `checkpoint_spec` (object, required): The checkpoint and high-water-mark rules the verifier checks.

---

## Outputs

- `verifier_spec` (object): The ordered checklist of verifier checks, the inputs, the per-outcome exit statuses, and the report format every stack verifier must match.

---

## Phase 1: Define the ordered check list

### Entry Criteria
- The four input specs are present.

### Actions
1. List the checks in order: parse each record against `record_schema`; canonicalize per `canonicalization_spec` and recompute `content_hash`; check `prev_hash` links and `seq` continuity per `chain_link_spec`; verify each checkpoint signature and the high-water mark per `checkpoint_spec`; and, when segments exist, check segment linkage.
2. For each check, define the exact failure message with the record `seq` or segment name and the expected versus found value, so the operator can locate the tamper.
3. State that the verifier reads only; it never writes to or repairs the log, so a verification run cannot itself alter evidence.
4. State that verification walks forward from genesis and reports the first failure position, and optionally continues to list all failures when asked.

### Output
An ordered checklist with a defined failure message per check.

### Quality Gate
- The checklist covers parse, content hash, chain links, seq, signatures, checkpoints, and segments.
- Each failure message names the location and the expected and found values.
- The verifier is specified as read-only.

---

## Phase 2: Define exit statuses and report

### Entry Criteria
- The checklist exists.

### Actions
1. Define distinct exit statuses so automation can branch: 0 for fully verified, a nonzero code for a hash or link failure, a different nonzero code for a signature or checkpoint failure, and another for an input or parse error. Pin the exact codes.
2. Define the report format: a machine-readable summary (records checked, first failure position if any, checks that passed) plus human-readable lines, so both a person and a pipeline can consume it.
3. State the inputs the verifier takes: the log path or segment directory, the public keys by `key_id`, and any anchored checkpoints to cross-check.
4. Record `verifier_spec` with the checklist, the exit status table, the report format, and the inputs.

### Output
`verifier_spec` with the exit-status table and the report format.

### Quality Gate
- Exit status 0 means fully verified and each failure class has its own pinned nonzero code.
- The report lists records checked and the first failure position.
- The verifier inputs include public keys resolved by `key_id`.

---

## Worked Example

Input (illustrative): the four specs from the design flows.

```
checks: parse -> recompute content_hash -> prev_hash/seq -> checkpoint sig/high-water -> segment links
exit: 0 ok | 2 hash-or-link | 3 signature-or-checkpoint | 4 input/parse
report: {records: 4001, first_failure: null, checkpoints_ok: 4}
```

`verifier_spec` fixes this so the Python and Go verifiers behave identically.

---

## Exit Criteria

DONE when `verifier_spec` gives an ordered read-only checklist, a message per failure with location and expected versus found, a pinned exit-status table, the report format, and the key inputs resolved by key_id.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A check is specified vaguely (for example looks valid) | **Adjust**: restate it as a recompute-and-compare with a named field and expected value. |
| Phase 1 | The verifier is allowed to repair the log | **Stop**: a verifier must be read-only; repair would alter the evidence it is judging. |
| Phase 2 | All failures share one exit code | **Adjust**: give each failure class a distinct code so automation can tell a hash failure from a signature failure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
