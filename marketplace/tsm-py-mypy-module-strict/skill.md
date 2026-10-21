# mypy Strict Per Module

**One-line description:** Writes a `pyproject.toml` mypy configuration with safe global settings and a `[[tool.mypy.overrides]]` block that applies the individual flags behind `--strict` to an explicit module list, then ratchets modules into that list in conversion order until the global `strict = true` form can replace it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `py_conversion_order` (object[], required): From `tsm-py-conversion-order`; the order modules join the strict list.
- `py_stub_report` (object[], required): From `tsm-py-stubs-missing-imports`; import errors must already be resolved.

---

## Outputs

- `py_mypy_config` (object): The committed `[tool.mypy]` and override sections, the config pattern in use (strict-in list or strict-out list), the strict module list, the legacy module list, and the mypy result after each ratchet commit.

---

## Phase 1: Write the Base Configuration

### Entry Criteria
- `mypy` is pinned in the dev group and `py_stub_report` shows no unresolved import errors.

### Actions
1. Move any existing `mypy.ini`, `.mypy.ini` or `setup.cfg [mypy]` settings into `pyproject.toml` `[tool.mypy]` only if the user agrees; otherwise edit the file that exists. mypy reads, in order, `mypy.ini`, `.mypy.ini`, `pyproject.toml`, `setup.cfg`, and uses the first one found, so two config files mean one is silently ignored. Check with `mypy --verbose 2>&1 | grep -i "config"`.
2. List the flags `--strict` enables in the installed version: `mypy --help | sed -n '/--strict /,/^$/p'`. Some of them are global-only and cannot go in an override. Check each against the "Per-module and global options" section of the mypy config docs for the installed version.
3. Base section (global options; these are safe for untyped code and catch config mistakes):
   ```toml
   [tool.mypy]
   python_version = "3.12"          # from requires-python lower bound
   files = ["src/billing"]
   warn_unused_configs = true       # flags override blocks that match no module
   warn_redundant_casts = true
   warn_unused_ignores = true
   strict_equality = true
   extra_checks = true
   show_error_codes = true
   ```
   Do not set `check_untyped_defs = true` globally yet; it checks the bodies of unannotated functions everywhere and is part of the strict set below.
4. Prepare the strict override block (per-module options; the strict-in pattern). Do not commit it yet: it is added in Phase 2 together with its first module, because an override without a module name is a config error.
   ```toml
   [[tool.mypy.overrides]]
   module = ["<first unit>"]
   disallow_untyped_defs = true
   disallow_incomplete_defs = true
   disallow_untyped_calls = true
   disallow_untyped_decorators = true
   disallow_any_generics = true
   disallow_subclassing_any = true
   check_untyped_defs = true
   warn_return_any = true
   no_implicit_reexport = true
   ```
   `strict = true` is not accepted inside an override; that is why the flags are listed one by one. Compare this list with step 2 and add any per-module strict flag the installed version has that is missing here.
5. Run `mypy` with only the base section. Error count must equal the current baseline. Commit `types: mypy base config`.

### Output
Base config committed.

### Quality Gate
- `mypy` exits with the same error count as `py_error_baseline.current`.
- Output contains no `unused section(s)` warning (produced by `warn_unused_configs` when an override matches no module).
- Only one mypy config source exists (`mypy --verbose` shows one config file).

---

## Phase 2: Ratchet Modules In

### Entry Criteria
- Phase 1 committed.

### Actions
1. Take the next unit from `py_conversion_order`. A unit joins the strict list only after `tsm-py-annotate-module` has made it pass; run them together: annotate, then add.
2. For the first unit, add the prepared override block from Phase 1 step 4. For later units, add the module names to its `module = [...]`. Use exact names for single modules (`"billing.money"`) and `"pkg.*"` only for a whole subpackage that is done (the pattern `billing.models.*` matches submodules but not `billing.models` itself; list both).
3. Run `mypy`. The errors in the newly listed modules must be 0; fix them with `tsm-py-annotate-module` before committing.
4. Commit `types(mypy-strict): add billing.money`.
5. Pattern switch: when the strict list is longer than the list of modules not yet in it, invert the configuration (strict-out pattern) in one commit:
   ```toml
   [tool.mypy]
   strict = true
   # ...base settings...

   [[tool.mypy.overrides]]
   module = ["billing.legacy.*", "billing.webhooks"]   # modules not yet converted
   disallow_untyped_defs = false
   disallow_incomplete_defs = false
   disallow_untyped_calls = false
   check_untyped_defs = false
   disallow_any_generics = false
   warn_return_any = false
   ```
   Now new modules are strict by default and the legacy list only shrinks. Run mypy before and after the inversion; the error count must be identical.
6. Never use `ignore_errors = true` for a legacy module unless it is already in the config; it hides real errors, including ones in calls to strict modules. If it exists, record it as debt to remove first.
7. When the legacy list is empty, delete its override block. The config is now global `strict = true` with no exceptions.

### Output
`py_mypy_config`.

### Quality Gate
- After each ratchet commit, `mypy` errors in strict-listed modules are 0: `mypy | grep -c "^src/billing/money.py"` prints 0.
- `mypy --strict` from the command line and plain `mypy` with the config give the same error count once the legacy list is empty.
- The strict list never shrinks between commits (`git log -p pyproject.toml` shows only additions to it, or the inversion commit).

---

## Worked Example

Illustrative only. `billing` with 120 modules, order from `tsm-py-conversion-order`.

Phase 1: base config committed; `mypy` prints `Success: no issues found in 120 source files`, matching the baseline.

Phase 2, first unit `billing.money` after annotation:
```
$ mypy
Success: no issues found in 120 source files
$ grep -A1 "module =" pyproject.toml
module = ["billing.money"]
```
After 61 modules the strict list (61) exceeds the rest (59); inversion commit sets `strict = true` with a 59-module legacy override. mypy count before and after inversion: 0 and 0. Eight weeks later the legacy block is deleted.

---

## Exit Criteria

DONE when every module is strict (global `strict = true` with no relaxing overrides), or the migration is paused with an explicit legacy list that only shrinks, and mypy exits 0.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `error: unrecognized option` or a per-module flag rejected | **Adjust**: the flag is global-only or unknown in this version; move it or drop it per the installed docs. |
| Phase 2 | Adding a module surfaces errors in other modules | **Adjust**: `disallow_untyped_calls` flags calls from the strict module into untyped ones; annotate the callee first (it should be earlier in the order). |
| Phase 2 | Error count changes during the inversion commit | **Retry**: a flag differs between the two forms; diff `mypy --help` strict list against both blocks. |
| Phase 2 | Pressure to add `ignore_errors = true` to pass CI | **Stop**: use the relaxed-flags legacy override instead; errors stay visible. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
