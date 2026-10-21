# Static Analysis Findings Triage

**One-line description:** Merges compiler warnings, clang-tidy and Cppcheck findings into one deduplicated list and classifies each with a fixed decision table as defect to fix, false positive with evidence, or deviation candidate, without suppressing anything.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `guideline_plan` (object, required): From `sccpp-standard-select`; supplies each guideline's category.
- `gcc_warning_report` (object, optional): From `sccpp-gcc-warning-set`; empty when that step was skipped.
- `clang_warning_report` (object, optional): From `sccpp-clang-warning-set`; empty when that step was skipped.
- `clang_tidy_findings` (object, required): From `sccpp-clang-tidy-config`.
- `cppcheck_findings` (object, optional): From `sccpp-cppcheck-misra-c`; empty for C++ code bases.

---

## Outputs

- `triaged_findings` (object[]): One row per unique finding location: file, line, sources (which tools), guideline ID if any, class (defect, false positive, deviation candidate), evidence, and owner action.
- `deviation_candidates` (object[]): The subset classed as deviation candidate, with the guideline, location and the technical reason the code cannot comply.

---

## Phase 1: Merge and Deduplicate

### Entry Criteria
- `clang_tidy_findings` present and at least one of the warning reports present.

### Actions
1. Convert each source to rows of (file, line, tool, rule or flag, message). Normalize paths to repository-relative.
2. Merge rows with the same file and line and the same underlying issue (for example `[-Wconversion]`, `cppcoreguidelines-narrowing-conversions` and `misra-c2012-10.3` on one line). Keep all tool names in `sources`.
3. Attach a guideline ID from `guideline_plan` where a tool mapping exists.
4. Sort: core defect checks first (`clang-analyzer-*`, Cppcheck `nullPointer`, `uninitvar`, `arrayIndexOutOfBounds`), then Mandatory, Required, Advisory guideline findings, then general warnings.

### Output
Merged, sorted finding list.

### Quality Gate
- Row count before and after merge is recorded; every input finding maps to exactly one merged row.

---

## Phase 2: Classify Each Finding

### Entry Criteria
- Merged list exists.

### Actions
1. Open the source at the line for each finding. Read at least the enclosing function.
2. Classify with this table, top row first:

| Condition | Class |
|---|---|
| The finding describes an execution that can occur (wrong value, out-of-range index, uninitialized read, truncation of a reachable value) | defect |
| The guideline category is Mandatory | defect (Mandatory guidelines cannot be deviated under MISRA Compliance:2020) |
| The tool misread the code, and you can state why with a line reference (for example a macro the analyzer did not expand) | false positive, with that evidence |
| The code must break the guideline for a technical reason that compliant code cannot meet (hardware register access through a cast from integer to pointer, adopted vendor code, a required compiler extension) | deviation candidate |
| None of the above is certain | defect (default; never default to false positive) |

3. A false positive needs evidence a reviewer can check: the line, the macro expansion (`gcc -E` output) or the analyzer limitation from its documentation. "Tool is wrong" alone is not evidence.
4. Do NOT edit code, add NOLINT, add `cppcheck-suppress` or add pragmas in this flow.

### Output
Classified list.

### Quality Gate
- Every row has a class.
- Every false positive has a non-empty evidence field with a file and line or a command output.
- Zero Mandatory guideline findings are classed deviation candidate.

---

## Phase 3: Hand Off

### Entry Criteria
- Classification complete.

### Actions
1. Emit `triaged_findings`.
2. Emit `deviation_candidates` with guideline ID, location, and the technical reason.
3. For defects, write the owner action as one sentence naming the flow that fixes the class (for example narrowing goes to `sccpp-c-overflow-checks`, recursion to `sccpp-loop-bounds-recursion`).

### Output
`triaged_findings`, `deviation_candidates`.

### Quality Gate
- Count of defects plus false positives plus deviation candidates equals total rows.

---

## Worked Example

Illustrative only. Three merged rows from a seat heater controller:

| file:line | sources | guideline | class | evidence |
|---|---|---|---|---|
| src/heat.c:41 | -Wconversion, misra-c2012-10.3 | Rule 10.3 | defect | `duty` is `uint32_t` up to 1000 stored into `uint8_t` |
| src/regs.h:12 | misra-c2012-11.4 | Rule 11.4 | deviation candidate | memory-mapped register `#define PWM_CR (*(volatile uint32_t *)0x40012C00u)` |
| src/heat.c:88 | clang-analyzer-core.NullDereference | none | false positive | pointer checked by `ASSERT_PTR` macro at line 85; `gcc -E` shows the early return |

---

## Exit Criteria

DONE when every finding is in exactly one class with evidence, and deviation candidates are listed for the deviation record flow.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Paths differ between tools (absolute vs relative) | **Adjust**: normalize with the repository root before merging. |
| Phase 2 | Cannot decide between defect and false positive | **Adjust**: class it defect (default rule) and note the doubt. |
| Phase 2 | Finding is in adopted third-party code | **Adjust**: class deviation candidate with reason "adopted code" and name the supplier. |
| Phase 3 | User asks to mark all Advisory findings false positive | **Stop**: Advisory guidelines are re-categorized only through the guideline plan, not through triage. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
