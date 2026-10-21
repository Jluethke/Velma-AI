# Coding Standard Selection and Guideline Plan

**One-line description:** Chooses the coding standard edition for an automotive C or C++ code base (MISRA C:2012 with amendments, MISRA C++:2023, or AUTOSAR C++14 guideline concepts) and writes a guideline plan that lists every guideline's category, how it is enforced, and which tool or review checks it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `language` (string, required): "c" or "cpp". The language the safety-relevant units are written in.
- `codebase_dir` (string, required): Path to the source tree root (the directory that holds the top-level CMakeLists.txt or Makefile).
- `integrity_level` (string, optional): The integrity level the project assigned to these units (for example an ISO 26262 ASIL letter or "QM"). Used only to record context; this flow never derives one.

---

## Outputs

- `guideline_plan` (object): Chosen standard and edition, language standard (-std value), the full guideline list with category (Mandatory, Required, Advisory, Disapplied), decidability, enforcement method (compiler, clang-tidy, cppcheck, commercial analyzer, manual review), and the open questions the user must answer.

---

## Phase 1: Choose the Standard and Edition

### Entry Criteria
- `language` is exactly "c" or "cpp".
- `codebase_dir` exists and contains source files (`*.c`, `*.h`, `*.cpp`, `*.hpp`, `*.cc`).

### Actions
1. Find the language standard the build uses. Run `grep -rn -- "-std=" "$codebase_dir" --include=CMakeLists.txt --include=*.cmake --include=Makefile` and `grep -rn "CMAKE_C_STANDARD\|CMAKE_CXX_STANDARD" "$codebase_dir"`. Record the value (for example `c99`, `c11`, `c++17`).
2. Pick the standard from this table. Do not choose by preference:

| `language` | Language standard in the build | Standard to adopt |
|---|---|---|
| c | C90, C99, C11 or C18 | MISRA C:2012 with Amendments 1 to 4 (also published consolidated as MISRA C:2023). If the project already bought a later MISRA C edition, use that edition and record it. |
| cpp | C++17 | MISRA C++:2023 |
| cpp | C++14 and the project already follows AUTOSAR C++14 (rule IDs like A7-1-1, M5-0-3) | Keep AUTOSAR C++14 guidelines; record an open question about migrating to MISRA C++:2023, which supersedes it |
| cpp | C++11 or C++14, no existing standard | MISRA C++:2023 concepts with an open question: the standard targets C++17, so the build standard must be raised or each gap recorded |
| cpp | C++20 or later | MISRA C++:2023 plus an open question: features newer than C++17 are outside its scope and need project rules |

3. Record that the guideline texts are copyrighted. The user must hold a licensed copy. Never paste full rule text from memory; cite rule numbers only (for example "MISRA C:2012 Rule 17.2").
4. Record the compliance framework: MISRA Compliance:2020 defines the guideline enforcement plan, guideline re-categorization plan, deviation records, deviation permits and guideline compliance summary. These are the record types this domain produces.

### Output
Chosen standard, edition and language standard, with the table row that selected them.

### Quality Gate
- The `-std` value (or CMake standard variable) is quoted with the file and line it came from.
- Exactly one table row is cited as the reason for the choice.

---

## Phase 2: Build the Guideline List

### Entry Criteria
- Standard and edition chosen.

### Actions
1. From the user's licensed copy, list every guideline with its ID, its category as published (Mandatory, Required, Advisory) and its decidability (Decidable or Undecidable, as the standard labels it).
2. Apply the re-categorization rules from MISRA Compliance:2020. Allowed: Advisory to Required, Advisory to Mandatory, Required to Mandatory, Advisory to Disapplied. Not allowed: lowering Mandatory or Required. Record each change with its reason.
3. For each guideline set the enforcement method using this rule set:
   - If a compiler diagnostic checks it (for example `-Wvla`, `-Wimplicit-fallthrough`), list the exact flag.
   - If clang-tidy has a check that targets it (for example `misc-no-recursion` for MISRA C:2012 Rule 17.2), list the check name and mark the mapping "partial" unless the check documentation states equivalence.
   - If the language is C, list the cppcheck MISRA addon ID form `misra-c2012-<rule>`.
   - If the guideline is Undecidable or no tool covers it, list "manual review" plus the review checklist item.
4. Never mark a guideline "covered" because a tool name sounds related. Each tool mapping must name a documented check.

### Output
Draft `guideline_plan` table.

### Quality Gate
- Every guideline in the edition has one row (row count equals the count in the standard's guideline list).
- No Mandatory or Required guideline is re-categorized downward.
- Every row has at least one enforcement method.

---

## Phase 3: Record Context and Open Questions

### Entry Criteria
- Draft table complete.

### Actions
1. Add `integrity_level` if given, verbatim, with the note that its assignment comes from the project's hazard analysis, not from this flow.
2. List open questions: guidelines with only manual review, partial tool mappings, language features outside the standard's scope, and any adopted third-party code (vendor drivers, RTOS sources) that needs its own compliance statement.
3. Save the plan as `guideline_plan.csv` (or JSON) under a `safety/` folder the user names. Do not edit source files in this flow.

### Output
`guideline_plan`.

### Quality Gate
- `guideline_plan` file exists and opens as valid CSV or JSON (`python -c "import json;json.load(open('guideline_plan.json'))"` exits 0 for JSON).
- Every open question names the guideline or file it concerns.

---

## Worked Example

Illustrative only. Input: `language` = "c", `codebase_dir` = `~/ecu/body-ctrl`, `integrity_level` = "ASIL B".

- Phase 1: `grep` finds `set(CMAKE_C_STANDARD 11)` in `CMakeLists.txt:4`. Row 1 selects MISRA C:2012 with Amendments 1 to 4.
- Phase 2: Rule 17.2 (recursion, Required, Undecidable) maps to `misc-no-recursion` (partial) and `misra-c2012-17.2` (cppcheck) plus manual review of function pointer calls. Rule 21.3 (memory allocation functions of stdlib.h, Required) maps to `misra-c2012-21.3` and a linker symbol check (`nm` for `malloc`). Dir 4.6 (typedefs for size and signedness, Advisory) is kept Advisory.
- Phase 3: Open question: "vendor CAN driver `drivers/can_ll.c` is adopted code; needs a separate compliance statement from the supplier or a project deviation."

---

## Exit Criteria

DONE when `guideline_plan` names one standard edition, lists every guideline with category and enforcement method, and lists every open question.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `-std` flag or CMake standard variable found | **Adjust**: run `gcc -dM -E -x c /dev/null | grep __STDC_VERSION__` with the project compiler to read the default, and record that the build relies on the default as an open question. |
| Phase 1 | User has no licensed copy of the standard | **Stop**: the guideline list and categories cannot be built from memory; ask the user to obtain the document. |
| Phase 2 | A tool mapping cannot be confirmed in the tool's documentation | **Adjust**: mark the guideline "manual review" and add an open question. |
| Phase 3 | User asks to state the code "is MISRA compliant" | **Return**: this flow records a plan only; a compliance claim needs the full evidence set and an assessor, which is outside this flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
