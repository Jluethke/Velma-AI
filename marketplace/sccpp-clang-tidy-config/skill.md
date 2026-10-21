# clang-tidy Configuration and Run for Guideline Checks

**One-line description:** Writes a .clang-tidy file whose checks are traced to rows of the guideline plan, runs run-clang-tidy against the host compile database, and produces a findings list grouped by check and file.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root.
- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; the host-test `compile_commands.json` path.
- `guideline_plan` (object, required): From `sccpp-standard-select`; rows whose enforcement method names clang-tidy checks.

---

## Outputs

- `clang_tidy_findings` (object): clang-tidy version, the `.clang-tidy` content, per-check counts, and every finding (file, line, check name, message), plus the exported fixes file path (not applied).

---

## Phase 1: Write .clang-tidy

### Entry Criteria
- `clang-tidy --version` prints a version (record it).
- The host-test `compile_commands.json` exists.

### Actions
1. Collect every clang-tidy check named in `guideline_plan`.
2. Confirm each check exists: `clang-tidy --list-checks -checks='*' | grep -x "    <check-name>"`. Drop and record any that do not.
3. Write `codebase_dir/.clang-tidy` (if one exists, show the user the diff and keep their entries):

```
Checks: >
  -*,
  bugprone-*,
  cert-*,
  clang-analyzer-*,
  misc-no-recursion,
  cppcoreguidelines-narrowing-conversions,
  readability-function-cognitive-complexity,
  readability-else-after-return
WarningsAsErrors: ''
HeaderFilterRegex: '^(src|include)/'
```

4. For C++ add the guideline-plan checks such as `cppcoreguidelines-no-malloc`, `cppcoreguidelines-owning-memory`, `cppcoreguidelines-pro-type-reinterpret-cast`, `hicpp-exception-baseclass`, `modernize-use-nullptr`, `bugprone-unused-return-value`.
5. `readability-function-cognitive-complexity` has a default `Threshold` documented by clang-tidy. Keep the default unless `guideline_plan` names a project value; never invent one.
6. Start with `WarningsAsErrors: ''`. Errors are set in Phase 3 only for clean checks.

### Output
`.clang-tidy` file.

### Quality Gate
- `clang-tidy --dump-config` run in `codebase_dir` shows the same Checks list.
- Every check in the list exists in `--list-checks` output.

---

## Phase 2: Run and Collect

### Entry Criteria
- `.clang-tidy` written.

### Actions
1. Run: `run-clang-tidy -p build/host-test -j <cores> -export-fixes build/host-test/tidy-fixes.yaml 2>&1 | tee build/host-test/tidy.log`. If `run-clang-tidy` is not installed, run per file: `clang-tidy -p build/host-test src/<file>.c`.
2. Count by check: `grep -o "\[[a-z]*-[a-zA-Z0-9.,-]*\]$" build/host-test/tidy.log | sort | uniq -c | sort -rn`.
3. Do NOT run with `-fix`. Exported fixes are suggestions to be reviewed one file at a time by the user, never applied in bulk.
4. `clang-analyzer-*` findings report a path. Read the numbered notes ("1. Assuming 'len' is > 16") from top to bottom to see the path; record the first note line.

### Output
Findings log and per-check counts.

### Quality Gate
- `tidy.log` exists and every source file listed in `compile_commands.json` under `src/` appears in the run (`grep -c '"file"' compile_commands.json` compared to files processed in the log header).
- `tidy-fixes.yaml` exists or the log states zero fixable findings.

---

## Phase 3: Report and Lock Clean Checks

### Entry Criteria
- Counts exist.

### Actions
1. Build `clang_tidy_findings` with each finding's file, line, check and message.
2. Mark each finding with the guideline row it traces to, or "no guideline" if the check is general.
3. For checks with zero findings, add them to `WarningsAsErrors` so they cannot regress.
4. Never add `// NOLINT` comments in this flow. Suppressions are created only from a deviation record.

### Output
`clang_tidy_findings`.

### Quality Gate
- Rerun with the new `WarningsAsErrors` exits 0 on the current tree.
- `grep -rn "NOLINT" src include | wc -l` count is recorded; each existing NOLINT is listed for triage.

---

## Worked Example

Illustrative only. Battery voltage monitor in C.

```
$ run-clang-tidy -p build/host-test -j 8 -export-fixes build/host-test/tidy-fixes.yaml
src/batt_mon.c:57:12: warning: function 'filter_step' is within a recursive call chain [misc-no-recursion]
src/batt_mon.c:102:9: warning: narrowing conversion from 'int' to 'uint8_t' [cppcoreguidelines-narrowing-conversions]
```

The recursion finding traces to MISRA C:2012 Rule 17.2 and goes to `sccpp-loop-bounds-recursion`; the narrowing goes to triage.

---

## Exit Criteria

DONE when `.clang-tidy` is traced to the guideline plan, every host translation unit was analyzed, findings are recorded per check, and clean checks are errors.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Check in plan does not exist in this clang-tidy version | **Adjust**: drop it, mark the guideline row "manual review", record the version. |
| Phase 2 | "Error while processing" because of missing target headers | **Adjust**: rerun against the host-test database; if still failing, add the stub include path the unit tests use and record it. |
| Phase 2 | Findings flood from generated code | **Adjust**: narrow `HeaderFilterRegex` and exclude the generator output directory with a recorded reason. |
| Phase 3 | User asks to apply all fixes | **Stop**: bulk fixes change behavior; apply per file with a test run after each. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
