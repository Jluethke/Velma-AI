# Python Type Error Baseline

**One-line description:** Captures the exact mypy or pyright error count per module and per error code, first under the current configuration and then under strict settings in a throwaway run, so the Python migration starts from measured numbers and knows which error classes dominate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `migration_profile` (object, required): From `tsm-migration-intake`; supplies `checker`, `checker_version`, `check_command`, `source_roots`.

---

## Outputs

- `py_error_baseline` (object): `current` (total, by error code or pyright rule, by module) and `strict` (the same three under strict settings), the exact commands used, and the paths of the saved raw logs.

---

## Phase 1: Baseline Under the Current Config

### Entry Criteria
- `migration_profile.checker` is `mypy` or `pyright` and the pinned checker runs.

### Actions
1. Create `.typecheck-logs/` and add it to `.git/info/exclude`.
2. mypy: run exactly `check_command` with error codes visible and save it:
   `mypy <source_roots> --show-error-codes --no-color-output --no-pretty > .typecheck-logs/mypy-current.txt 2>&1; echo "exit=$?"`
   (`--show-error-codes` is the default on recent mypy; passing it is harmless.) Lines look like `src/billing/invoice.py:42: error: Item "None" of "Optional[Customer]" has no attribute "email"  [union-attr]`. The last line is `Found 37 errors in 9 files (checked 120 source files)` or `Success: no issues found in 120 source files`.
   Exit codes: 0 clean, 1 type errors found, 2 crash or bad usage. Exit 2 is a failure of the run, not a baseline.
3. mypy counts:
   - Total: copy the number from the `Found N errors` line.
   - By code: `grep -oE "\[[a-z0-9-]+\]$" .typecheck-logs/mypy-current.txt | sort | uniq -c | sort -rn`
   - By module: `grep ": error:" .typecheck-logs/mypy-current.txt | cut -d: -f1 | sort | uniq -c | sort -rn`
   - `note:` lines are not errors; do not count them.
4. pyright: `pyright --outputjson > .typecheck-logs/pyright-current.json; echo "exit=$?"`. Exit 0 clean, 1 errors, other values are a failed run. Counts:
   - Total: `python -c "import json;d=json.load(open('.typecheck-logs/pyright-current.json'));print(d['summary']['errorCount'])"`
   - By rule: `python -c "import json,collections as c;d=json.load(open('.typecheck-logs/pyright-current.json'));print(c.Counter(x.get('rule','-') for x in d['generalDiagnostics'] if x['severity']=='error').most_common())"`
   - By file: same with `x['file']`.
5. Record `current`.

### Output
`current` counts and logs.

### Quality Gate
- mypy: the by-code counts sum to the `Found N errors` number. pyright: the by-rule counts sum to `summary.errorCount`.
- The run exit code is 0 or 1, never 2 (mypy) or a crash.

---

## Phase 2: Measure Under Strict Settings

### Entry Criteria
- Phase 1 complete.

### Actions
1. mypy: run with `--strict` on the command line without touching the config:
   `mypy <source_roots> --strict --show-error-codes --no-pretty > .typecheck-logs/mypy-strict.txt 2>&1`
   See which flags `--strict` enables in the installed version: `mypy --help | sed -n '/--strict /,/^$/p'`. Command-line `--strict` does not override per-module `ignore_errors = true` sections; note any such sections from the config in the baseline.
2. pyright: create a throwaway `pyrightconfig.strict-probe.json` copying `include`, `pythonVersion` and venv settings from the current config plus `"typeCheckingMode": "strict"`, run `pyright -p pyrightconfig.strict-probe.json --outputjson > .typecheck-logs/pyright-strict.json`, then delete the probe file. Pyright uses `pyrightconfig.json` over `[tool.pyright]` when both exist, so `-p` with an explicit file is required.
3. Count by code or rule and by module as in Phase 1. Record under `strict`.
4. Map the dominant codes to the flow that fixes them:

   | mypy code / pyright rule | Fixed in |
   |---|---|
   | `no-untyped-def`, `no-untyped-call` / `reportMissingParameterType`, `reportUnknownParameterType` | `tsm-py-annotate-module` |
   | `import-untyped`, `import-not-found` / `reportMissingTypeStubs`, `reportMissingImports` | `tsm-py-stubs-missing-imports` |
   | `type-arg` / `reportMissingTypeArgument` | `tsm-py-generics-paramspec` |
   | `no-any-return`, `misc` (Any subclass), `redundant-cast`, `unused-ignore` / `reportUnknownMemberType`, `reportUnknownVariableType`, `reportUnnecessaryCast` | `tsm-py-eliminate-any-cast` |
   | `union-attr`, `arg-type`, `return-value`, `assignment` | real type mismatches: `tsm-py-annotate-module` and `tsm-py-eliminate-any-cast` |

5. Confirm the probe left no trace: `git status --porcelain` lists no tracked change.

### Output
`py_error_baseline`.

### Quality Gate
- Both strict logs exist (or the one for the chosen checker) and counts sum correctly.
- `git status --porcelain` shows no tracked file changed.

---

## Worked Example

Illustrative only. `src/billing`, mypy 1.11.2.

Phase 1: `Success: no issues found in 120 source files`; current total 0 (the config is lenient).

Phase 2:
```
$ mypy src/billing --strict --no-pretty | tail -1
Found 1184 errors in 97 files (checked 120 source files)
$ grep -oE "\[[a-z0-9-]+\]$" .typecheck-logs/mypy-strict.txt | sort | uniq -c | sort -rn | head -5
    611 [no-untyped-def]
    203 [no-untyped-call]
     98 [type-arg]
     77 [import-untyped]
     61 [union-attr]
```
`import-untyped` goes first (stubs), then annotation.

---

## Exit Criteria

DONE when current and strict counts by code and by module come from saved logs, sums match, and the repository is unchanged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | mypy exits 2 or prints `INTERNAL ERROR` | **Retry**: rerun with `--show-traceback`; if it persists, clear `.mypy_cache` and rerun; report a reproducible crash to the user. |
| Phase 1 | `Duplicate module named` or `Source file found twice under different module names` | **Adjust**: set `explicit_package_bases`/`mypy_path` or pass the package with `-p`; record the change for `tsm-py-mypy-module-strict`. |
| Phase 1 | pyright cannot find installed packages (`reportMissingImports` on every third-party import) | **Adjust**: set `venvPath` and `venv` or run inside the activated environment; then rerun. |
| Phase 2 | Probe file left behind | **Return**: delete it and confirm `git status` is clean. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
