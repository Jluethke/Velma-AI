# Python Type Coverage Measurement

**One-line description:** Measures how much of a Python codebase is precisely typed with mypy's `--any-exprs-report` and `--lineprecision-report` (or pyright's `--verifytypes` for a published package), saves the per-module numbers, and records the single figure the CI ratchet will compare against.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `migration_profile` (object, required): Supplies `checker`, `source_roots`, and whether the project is a published library (has `py.typed` or is uploaded to an index).

---

## Outputs

- `py_type_coverage` (object): The metric used (`any-exprs` or `verifytypes`), the exact command, the total figure as printed, per-module figures sorted ascending, the checker version, and the paths of the saved report files.

---

## Phase 1: Choose the Metric

### Entry Criteria
- The checker from `migration_profile` runs without a crash.

### Actions
1. Pick with this table:

   | Situation | Metric | Why |
   |---|---|---|
   | Any project, mypy available (mypy can be installed for measurement even if pyright is the gate) | `any-exprs` from mypy | Counts every expression whose inferred type is `Any`; it directly measures what the migration removes. |
   | Published library with `py.typed` | add `verifytypes` from pyright | Reports the share of public symbols with known types, which is what library users see. |

2. Record the choice. Both may be recorded; the CI ratchet uses one, named here.

### Output
Metric chosen.

### Quality Gate
- The chosen metric row is recorded with its reason.

---

## Phase 2: Run the Reports

### Entry Criteria
- Metric chosen.

### Actions
1. mypy any-exprs and line precision (these two reports need no extra packages; `--html-report` and `--txt-report` need `lxml`, so do not use them unless `lxml` is installed):
   `mypy <source_roots> --any-exprs-report .typecheck-logs/mypy-cov --lineprecision-report .typecheck-logs/mypy-cov`
   This writes `any-exprs.txt`, `types-of-anys.txt` and `lineprecision.txt` into the directory. The run still prints type errors; coverage is valid with errors present, but record the error count next to it.
2. Read `any-exprs.txt`: one row per module with columns `Name`, `Anys`, `Exprs`, `Coverage`, and a `Total` row at the end. `Coverage` is the percentage of expressions that are not `Any`. Copy the `Total` row's `Coverage` value exactly as the headline figure.
3. Read `types-of-anys.txt`: per module counts of `Any` by origin, with columns such as `Unannotated`, `Explicit`, `Unimported`, `Omitted Generics`, `Error`, `Special Form`, `Implementation Artifact`. Use it to route work:

   | Largest column | Next flow |
   |---|---|
   | `Unannotated` | `tsm-py-annotate-module` |
   | `Unimported` | `tsm-py-stubs-missing-imports` |
   | `Omitted Generics` | `tsm-py-generics-paramspec` |
   | `Explicit` | `tsm-py-eliminate-any-cast` |

   If the installed mypy prints different column names, use its header; do not rename columns.
4. Read `lineprecision.txt`: per module `Lines`, `Precise`, `Imprecise`, `Any`, `Empty`, `Unanalyzed`. `Unanalyzed` lines are inside unannotated functions that mypy skips by default (unless `check_untyped_defs` is on); a high `Unanalyzed` count means the error baseline understates the real error count.
5. pyright verifytypes (libraries only): `pyright --verifytypes <package_name> --ignoreexternal --outputjson > .typecheck-logs/verifytypes.json`. Read `typeCompleteness.completenessScore` (0 to 1) and the counts of symbols with known, ambiguous and unknown types. Run `pyright --verifytypes <package_name> --ignoreexternal` without JSON once to see the human-readable symbol list.
6. Sort modules by coverage ascending: `grep "%" .typecheck-logs/mypy-cov/any-exprs.txt | grep -v "Total" | sort -k4 -n`. Copy the result into the per-module figures.

### Output
`py_type_coverage`.

### Quality Gate
- The headline figure in `py_type_coverage` appears verbatim in `any-exprs.txt` (`Total` row) or in `verifytypes.json`.
- Running the same command twice gives the same figure.
- The checker version used is recorded (a mypy upgrade can change the figure).

---

## Worked Example

Illustrative only. `src/billing`, mypy 1.11.2, not a published library.

Phase 2:
```
$ mypy src/billing --any-exprs-report .typecheck-logs/mypy-cov --lineprecision-report .typecheck-logs/mypy-cov
Success: no issues found in 120 source files
$ tail -3 .typecheck-logs/mypy-cov/any-exprs.txt
            billing.webhooks     412   1880     78.09%
  ---------------------------------------------------
                       Total    5210  31004     83.20%
```
Headline: 83.20. `types-of-anys.txt` shows `Unannotated` as the largest column for 71 of 120 modules, so annotation is the main work. `lineprecision.txt` shows 9,412 `Unanalyzed` lines, which is why the current error count is 0.

---

## Exit Criteria

DONE when the headline figure, per-module table and command are recorded from saved report files and reproduce on a second run.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `You must install the lxml package before you can run mypy with --html-report` | **Adjust**: drop the HTML or txt report; the any-exprs and lineprecision reports do not need it. |
| Phase 2 | Report directory empty | **Retry**: mypy crashed before writing; rerun with `--show-traceback` and read the error. |
| Phase 2 | verifytypes says the package is not found | **Adjust**: install the package into the environment pyright uses (`pip install -e .`) and pass the import name, not the distribution name. |
| Phase 2 | Someone proposes excluding modules to raise the figure | **Stop**: only generated code may be excluded, and the exclusion must be listed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
