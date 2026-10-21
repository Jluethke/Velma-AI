# Cppcheck MISRA C Addon Run

**One-line description:** Runs open-source Cppcheck with its MISRA C:2012 addon against the project compile database, supplies the user's licensed rule texts so messages are readable, and produces findings by rule ID in XML.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root of a C code base.
- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; the host-test or target `compile_commands.json`.
- `misra_rule_texts` (string, optional): Path to a plain text file of rule headlines the user extracted from their licensed MISRA C:2012 document, in the format the addon documents. Absent means findings show rule IDs only.

---

## Outputs

- `cppcheck_findings` (object): Cppcheck version, the exact command, findings per `misra-c2012-*` ID and per Cppcheck core check, the XML report path, and analysis errors (missing includes, unknown macros).

---

## Phase 1: Prepare the Run

### Entry Criteria
- `cppcheck --version` prints a version (record it).
- The code base is C. The free addon targets MISRA C:2012; MISRA C++ checking is offered only in commercial editions and is out of scope here.

### Actions
1. Choose the compile database: use the target profile if it exists (it carries the real target defines), else host-test.
2. If `misra_rule_texts` is given, write `misra.json` in a scratch folder outside the marketplace and outside `src/`:

```
{
  "script": "misra.py",
  "args": ["--rule-texts=/path/to/misra_rule_texts.txt"]
}
```

3. Pick `--std=` matching the build (`c99` or `c11`) and the platform. Run `cppcheck --help` and read the `--platform` list; choose the entry matching the target word size (for a 32-bit ARM MCU, the 32-bit entry). Do not guess the name.
4. Create `build/cppcheck/` for output and the `--cppcheck-build-dir` cache.

### Output
Command line and addon config ready.

### Quality Gate
- `--platform` value appears in `cppcheck --help` output.
- `misra.json` points to an existing rule text file, or the report notes that rule texts were not supplied.

---

## Phase 2: Run Cppcheck

### Entry Criteria
- Command ready.

### Actions
1. Run:

```
cppcheck --project=build/target/compile_commands.json \
  --addon=misra.json --std=c11 --platform=<from --help> \
  --enable=warning,style,performance,portability \
  --inline-suppr --cppcheck-build-dir=build/cppcheck \
  --xml --output-file=build/cppcheck/report.xml \
  -i build/
```

   Use `--addon=misra` instead of `misra.json` when no rule texts exist.
2. Run once more with `--check-config` only if the report contains `missingInclude` or `unknownMacro` messages, and fix include paths through the compile database, never by deleting code.
3. Count by ID: `grep -o 'id="[^"]*"' build/cppcheck/report.xml | sort | uniq -c | sort -rn`.

### Output
`report.xml` and per-ID counts.

### Quality Gate
- `report.xml` parses: `python -c "import xml.etree.ElementTree as E;E.parse('build/cppcheck/report.xml')"` exits 0.
- Count of `misra-c2012-` IDs is recorded, even when zero.

---

## Phase 3: Read and Report

### Entry Criteria
- Counts exist.

### Actions
1. Read each ID with this table:

| ID prefix | Meaning | Next step |
|---|---|---|
| `misra-c2012-N.M` | Addon finding against Rule N.M | Triage against `guideline_plan` category |
| `misra-config` | Addon could not analyze something (often unknown macro) | Fix configuration first; a config error hides findings |
| `nullPointer`, `arrayIndexOutOfBounds`, `uninitvar` | Cppcheck core defect checks | Treat as likely defects; triage first |
| `missingInclude`, `missingIncludeSystem` | Analysis was partial | Record; does not mean the code is clean |

2. Remember the free addon does not check every MISRA rule. Rules it does not implement stay with the enforcement methods in `guideline_plan`. Never report "no findings" as "compliant".
3. Existing `// cppcheck-suppress` comments are listed for triage; do not add new ones here.

### Output
`cppcheck_findings`.

### Quality Gate
- Every `misra-config` or `missingInclude` message is listed with its file.
- The report states which rules the addon does not cover, from the addon's documentation, or marks it as an open question.

---

## Worked Example

Illustrative only. Brake lamp output module (lamp driver, not the brake system) in C11.

```
$ grep -o 'id="[^"]*"' build/cppcheck/report.xml | sort | uniq -c | sort -rn
      6 id="misra-c2012-10.4"
      3 id="misra-c2012-15.5"
      1 id="misra-c2012-17.7"
      1 id="uninitvar"
```

`uninitvar` in `lamp_diag.c:73` is triaged first. Rule 15.5 (single point of exit) is Advisory in the plan.

---

## Exit Criteria

DONE when Cppcheck ran on every translation unit in the database, the XML report parses, and every finding and configuration error is counted by ID.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Code base is C++ | **Return**: use `sccpp-clang-tidy-config` and record a generic commercial analyzer as an open question for MISRA C++:2023. |
| Phase 2 | Addon fails with Python error | **Adjust**: confirm `python3` is on PATH and the addon script ships with this Cppcheck version (`cppcheck --version`, addons directory); record the fix. |
| Phase 2 | Run takes hours | **Adjust**: add `-j <cores>` and keep `--cppcheck-build-dir` for incremental runs. |
| Phase 3 | Hundreds of `misra-config` messages | **Stop**: fix analysis configuration before triage; findings are not trustworthy yet. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
