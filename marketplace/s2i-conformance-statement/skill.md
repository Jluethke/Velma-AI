# Implementation Conformance Statement

**One-line description:** Writes the implementation conformance statement (in the style of an ISO/IEC 9646-7 ICS / PICS proforma and the RFC 7942 "Implementation Status" section) declaring per requirement whether it is supported, how it was verified, every deviation and ambiguity decision, and the exact spec version and errata applied.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `traceability_matrix` (object[], required): From `s2i-traceability-matrix`.
- `coverage_gaps` (object[], required): From `s2i-traceability-matrix`.
- `ambiguity_log` (object[], required): From `s2i-ambiguity-log`.
- `errata_log` (object[], required): From `s2i-errata-check`.
- `spec_bundle` (object, required): From `s2i-spec-acquire-pin`.
- `implementation_role` (string, required): The role(s) the statement covers.

---

## Outputs

- `conformance_statement` (string): Path to `CONFORMANCE.md` in the repository root.

---

## Phase 1: Decide the Claim

### Entry Criteria
- Matrix and gaps exist.

### Actions
1. Decide the overall claim with this table. The first matching row wins.

   | Condition from the matrix | Allowed claim |
   |---|---|
   | Any MUST or MUST_NOT row with `applies` yes is `FAILING`, `UNTESTED`, or `SKIPPED_ONLY` | "Partial implementation of <spec>; does not conform" and list those rows |
   | All MUST/MUST_NOT pass; any SHOULD deviates or is untested | "Conforms to the MUST-level requirements of <spec> for role <role>; deviations from SHOULD-level requirements are listed" |
   | All MUST and SHOULD pass | "Conforms to <spec> for role <role> as verified by the tests listed" |

2. Never write "fully compliant", "certified", or "100%" unless an official certification program exists for this spec and you passed it; cite that program by name if so.
3. The claim always names the exact version pin from `spec_bundle.version_pin` and the role from `implementation_role`.

### Output
Claim sentence.

### Quality Gate
- The claim sentence is one of the three templates with values filled in.
- A script or `jq` query over `reports/traceability.csv` reproduces the condition that selected the row (saved in the run notes).

---

## Phase 2: Write the Statement

### Entry Criteria
- Claim decided.

### Actions
1. Create `CONFORMANCE.md` with these sections in this order:
   1. **Specification**: ID, version pin, SHA-256 of the spec files, updating documents included.
   2. **Claim**: the Phase 1 sentence.
   3. **Errata applied**: every `errata_log` row with `APPLY` or `APPLY_AND_LOG`, with the erratum ID.
   4. **Support table (ICS)**: one row per requirement: `Req ID | Level | Support (Yes / No / N/A / Partial) | Verified by | Notes`. "Verified by" names tests, suite cases, or review evidence from the matrix.
   5. **Deviations**: every SHOULD/SHOULD NOT where behavior differs from the recommendation, with the reason. RFC 2119 says SHOULD may be ignored only when "the full implications [are] understood and carefully weighed"; write those implications down.
   6. **Implementation choices for ambiguities**: every `ambiguity_log` row with its decision and basis.
   7. **Optional features (MAY)**: implemented or not.
   8. **Known gaps**: `coverage_gaps` rows, verbatim IDs.
   9. **How to reproduce**: the exact commands to run conformance tests, public suites, and interop scenarios.
2. Fill Support from status: `PASSING` gives Yes; `FAILING` gives No (or Partial if some tests pass); `N/A` gives N/A; `REVIEW` gives Yes only with a named reviewer and evidence file.
3. If the user publishes an Internet-Draft or RFC about this protocol, a short version of this file becomes its "Implementation Status" section per RFC 7942.

### Output
`CONFORMANCE.md`.

### Quality Gate
- Support table row count equals the matrix row count.
- Every "Yes" row has a non-empty "Verified by".
- `grep -niE 'fully compliant|certified|100%' CONFORMANCE.md` prints nothing (unless a named certification was passed).

---

## Worked Example

Illustrative. RFC 6455 server.

Phase 1: The matrix shows REQ-5.5.1-03 `FAILING` (Close with 1-byte payload). Claim: "Partial implementation of RFC 6455 (sha256 <hash>); does not conform. Failing: REQ-5.5.1-03."

After the fix and a rerun of the matrix, all MUST rows pass and one SHOULD (REQ-7.2.3-01 recommended reconnect backoff, client-only) is N/A. Claim: "Conforms to RFC 6455 for role server as verified by the tests listed."

Phase 2 excerpt:
```
| Req ID       | Level | Support | Verified by                                   | Notes |
|--------------|-------|---------|-----------------------------------------------|-------|
| REQ-5.1-02   | MUST  | Yes     | TestSec5_1/T-5.1-02-01; Autobahn 1.x cases     |       |
| REQ-5.5.1-03 | MUST  | Yes     | TestSec5_5/T-AMB-004-01; Autobahn 7.3.2       | AMB-004 |
```

---

## Exit Criteria

DONE when `CONFORMANCE.md` states a claim that matches the matrix by rule, lists every requirement with its support and evidence, and discloses every deviation, ambiguity choice, erratum and gap.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User asks for a stronger claim than the matrix allows | **Stop**: show the failing rows; the claim follows the evidence. |
| Phase 2 | REVIEW rows with no reviewer | **Adjust**: mark Support "Partial" with "review pending". |
| Phase 2 | Matrix older than the latest test run | **Retry**: rerun `s2i-traceability-matrix` before writing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
