# Python Public API Snapshot with griffe

**One-line description:** Records the public API of a Python package at the baseline commit with `griffe dump`, then uses `griffe check` against the baseline git ref after every refactoring step so any removed name, changed signature or changed default is reported as a breakage before it is committed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `package_name` (string, required): Importable top-level package, for example `billing`.
- `baseline_commit` (string, required): SHA from `srf-baseline-green-check`.

---

## Outputs

- `api_snapshot` (string): Path of the JSON dump of the public API at the baseline, stored outside the package source, for example `.refactor/api-baseline.json`.
- `api_check_command` (string): The exact command to rerun after each step, for example `griffe check billing --search src --against 9f2c4e1`.

---

## Phase 1: Install and Locate the Package

### Entry Criteria
- `git rev-parse HEAD` equals `baseline_commit`.

### Actions
1. Run `griffe --version`. If it fails, `pip install griffe` into the dev environment and record the version.
2. Find the package root with this table:

| Layout | Evidence | `--search` value |
|---|---|---|
| src layout | `src/<package_name>/__init__.py` exists | `src` |
| flat layout | `<package_name>/__init__.py` at repo root | `.` |
| Namespace package (no `__init__.py`) | Directory exists but no `__init__.py` | the parent directory; confirm griffe finds it in Phase 2 |

3. Read `<package_name>/__init__.py`. If it defines `__all__`, the public API is that list. If not, griffe treats names without a leading underscore as public. Record which rule applies.
4. Run `griffe check --help` and `griffe dump --help` to confirm the flags `--search`/`-s`, `--against`/`-a` and `--output`/`-o` in the installed version. Use what `--help` prints if it differs from this flow.

### Output
Search path and public API rule.

### Quality Gate
- `griffe --version` prints a version.
- The `--search` value points at a directory containing `<package_name>`.

---

## Phase 2: Snapshot and Self-Check

### Entry Criteria
- Phase 1 complete.

### Actions
1. Dump: `mkdir -p .refactor && griffe dump billing --search src --output .refactor/api-baseline.json`. Add `.refactor/` to `.git/info/exclude` so the dump is never committed by accident.
2. Open the JSON. Confirm it contains your top-level module and at least one known public function name: `grep -c '"name": "parse_invoice"' .refactor/api-baseline.json`.
3. Build `api_check_command`: `griffe check billing --search src --against <baseline_commit>`. griffe reads the old version from git at that ref, so the working tree is compared with the baseline.
4. Run `api_check_command` now, with no changes. It must exit 0 and print no breakages. This proves the command itself works before you rely on it.
5. Mutation check: rename one public function in a scratch edit, run `api_check_command`, confirm it prints a breakage line naming that function, then `git checkout -- <file>`.

### Output
`api_snapshot`, `api_check_command`.

### Quality Gate
- `.refactor/api-baseline.json` exists and step 2's grep count is 1 or more.
- `api_check_command` exits 0 on the unchanged tree.
- The step 5 mutation produced a breakage line and a non-zero exit.
- `git status --porcelain` is empty after the restore.

---

## Phase 3: How to Read Results During the Refactor

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. After each later refactoring step, run `api_check_command` before committing.
2. Apply this table to its output:

| griffe output | Meaning | Action |
|---|---|---|
| No output, exit 0 | Public API unchanged | Commit the step. |
| `Public object was removed` | A public name disappeared (rename, move, delete) | If the refactor intends to keep compatibility, add a re-export or alias in the old location; else stop and get user approval for a breaking change. |
| `Parameter was removed` / `Parameter kind was changed` / `Positional parameter was moved` | Signature changed | Revert the step or add a compatibility wrapper; parameter object refactors must keep the old signature as a wrapper until callers move. |
| `Parameter default was changed` | Default value differs | Revert; this changes behavior for callers relying on the default. |
| `Attribute value was changed` | A public constant changed | Revert unless the user approved it. |

3. Never edit `api_snapshot` or pass a newer `--against` ref to make the check pass.

### Output
A documented decision rule for each later step.

### Quality Gate
- The decision table is copied into the refactor log so each later step can cite it.

---

## Worked Example

Illustrative only.
```
$ griffe dump billing --search src --output .refactor/api-baseline.json
$ griffe check billing --search src --against 9f2c4e1
$ echo $?
0
```
Mutation: rename `parse_invoice` to `parse_invoice_text` in `src/billing/invoice.py`.
```
$ griffe check billing --search src --against 9f2c4e1
src/billing/invoice.py:0: parse_invoice: Public object was removed
$ git checkout -- src/billing/invoice.py
```
`api_check_command = "griffe check billing --search src --against 9f2c4e1"`.

---

## Exit Criteria

DONE when the baseline API is dumped, the check command passes on an unchanged tree, a deliberate rename is caught, and the decision table is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | griffe cannot find the package | **Adjust**: try the other `--search` value from the table; report both attempts if neither works. |
| Phase 2 | `--against` ref not found | **Adjust**: use the full SHA; shallow clones need `git fetch --unshallow`. |
| Phase 2 | Check reports breakages on an unchanged tree | **Stop**: the baseline ref and tree differ; confirm HEAD equals `baseline_commit`. |
| Phase 3 | Intended breaking change | **Return**: ask the user to approve it explicitly and record the approval in the log. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
