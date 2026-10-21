# Guideline Deviation Record

**One-line description:** Writes one deviation record per guideline violation that must remain, following the record structure in MISRA Compliance:2020 (guideline, scope, reason, justification, risk controls, approval), and adds a suppression comment that cites the record ID.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `deviation_candidates` (object[], required): From `sccpp-findings-triage`.
- `guideline_plan` (object, required): From `sccpp-standard-select`; supplies categories so Mandatory guidelines are refused.

---

## Outputs

- `deviation_records` (object[]): One record per deviation: ID, guideline, category, location or scope, reason class, justification, risk controls with their verification evidence, the suppression comment text added, and approval status (always "pending approval" when written by this flow).

---

## Phase 1: Screen the Candidates

### Entry Criteria
- `deviation_candidates` is non-empty. If empty, emit an empty `deviation_records` and stop.

### Actions
1. Look up each candidate's guideline in `guideline_plan`.
2. Apply:

| Category | Action |
|---|---|
| Mandatory | Refuse. Return to triage as a defect. |
| Required | Deviation record required. |
| Advisory | Deviation record not formally required by MISRA Compliance:2020, but the project may require one; follow `guideline_plan`. If the plan is silent, write one. |
| Disapplied | No record; list it as covered by the re-categorization plan. |

3. Group candidates that share one reason across many sites (for example every register access macro in `regs.h`) into one record with an explicit scope (file list or macro name). Do not use a project-wide scope like "all files".

### Output
Screened candidate groups.

### Quality Gate
- Zero Mandatory guidelines remain.
- Every group has a scope that lists files or symbols.

---

## Phase 2: Write the Records

### Entry Criteria
- Screened groups exist.

### Actions
1. Assign IDs in sequence: `DEV-<guideline>-<NNN>`, for example `DEV-R11.4-001`.
2. Fill each record:
   - Guideline: standard, edition, ID (for example "MISRA C:2012 Rule 11.4").
   - Scope: files, lines, symbols.
   - Reason class: one of access to hardware, adopted code integration, code quality, performance, non-compliant adopted code. These are the reason kinds MISRA Compliance:2020 describes; pick the closest and name it.
   - Justification: the concrete technical fact (for example "peripheral registers are at fixed addresses in the reference manual section 9.4; no compliant construct expresses a fixed address").
   - Risk controls: what prevents the hazard the guideline addresses (for example "addresses defined once in `regs.h`, cross-checked against the vendor SVD file by a unit test").
   - Verification of the controls: the command or test that proves each control.
   - Approval: "pending approval". This flow never approves its own record.
3. Do not write a justification that only says the code is "safe" or "needed". It must name the constraint.

### Output
Draft records.

### Quality Gate
- Every record has all fields non-empty.
- Every risk control names a command, test or review item that can be run or opened.

---

## Phase 3: Link Suppressions to Records

### Entry Criteria
- Records drafted.

### Actions
1. For each site, add the narrowest suppression the tool supports, and only on the lines in scope:
   - clang-tidy: `// NOLINT(check-name) DEV-R11.4-001` on the line, or `NOLINTNEXTLINE(check-name)`.
   - Cppcheck: `// cppcheck-suppress misra-c2012-11.4 ; DEV-R11.4-001` on the line before (Cppcheck needs `--inline-suppr`).
   - GCC or Clang: `#pragma GCC diagnostic push`, `#pragma GCC diagnostic ignored "-Wcast-align"`, code, `#pragma GCC diagnostic pop`, with the record ID in a comment.
2. Edit one file at a time and rebuild after each with the warnings profile. Never use a bare `NOLINT` without a check name.
3. Rerun the tool and confirm only the in-scope findings disappeared.

### Output
`deviation_records` with suppression text recorded.

### Quality Gate
- `grep -rn "DEV-" src include` lists every suppression and each ID exists in `deviation_records`.
- Tool finding count dropped by exactly the number of suppressed sites (compare before and after counts).

---

## Worked Example

Illustrative only. Candidate: Rule 11.4 (conversion between pointer to object and integer, Advisory) in `src/regs.h:12`.

Record `DEV-R11.4-001`: scope `regs.h` macros `PWM_CR`, `PWM_ARR`; reason class access to hardware; justification cites the MCU reference manual memory map; control: unit test `test_regs_match_svd` compares each address with the vendor SVD file; approval pending.

Suppression added: `/* cppcheck-suppress misra-c2012-11.4 ; DEV-R11.4-001 */`. Cppcheck count for 11.4 drops from 2 to 0; no other ID changes.

---

## Exit Criteria

DONE when every Required (and plan-selected Advisory) deviation candidate has a complete record, every suppression cites a record ID, and approvals are marked pending.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Candidate is a Mandatory guideline | **Return**: send back to triage as a defect. |
| Phase 2 | No technical constraint can be named | **Return**: the code can comply; send it back as a defect. |
| Phase 3 | Suppression removes more findings than the scope | **Adjust**: narrow to the line-level form and recheck counts. |
| Phase 3 | User asks to mark records approved | **Stop**: approval is a human sign-off by the project's named authority; record the approver's name only when they provide it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
