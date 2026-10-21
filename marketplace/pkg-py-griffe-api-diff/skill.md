# Python API Diff With griffe

**One-line description:** Classifies a Python release as major, minor or patch by running `griffe check` against the previous release tag, reading each reported breakage, and adding the additions griffe does not report.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_export_surface` (object, required): From `pkg-py-dunder-all-exports`; the current `__all__` per module.
- `previous_release_ref` (string, optional): Git tag or commit of the last published release, for example `v0.4.1`. Absent means first release.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `py_change_class` (string): One of `initial`, `major`, `minor`, `patch`, `none`.
- `py_api_diff` (object): Every breakage griffe reported (kind, object path, old value, new value), every added public name, and the pasted griffe output.

---

## Phase 1: Run griffe check

### Entry Criteria
- `previous_release_ref` resolves: `git rev-parse --verify <ref>^{commit}` exits 0. If the input is absent, set `py_change_class = initial` and skip to Phase 3.

### Actions
1. Install: `python -m pip install griffe`. Record `griffe --version`.
2. Run from `project_dir`, using `-s src` only for src layout:
   ```
   griffe check <import_name> -s src --against <previous_release_ref>
   ```
   griffe loads the package at the git ref in a temporary worktree and compares it with the working tree. Check `griffe check --help` for the exact flag spelling of your version (`-a` is the short form of `--against`).
3. Read the exit code: 0 means no breakage found; non-zero with listed lines means breakages.
4. Copy every output line to `py_api_diff.breakages`. Typical messages: removed object, parameter removed, parameter kind changed, positional parameter moved, required parameter added, default value changed, attribute changed type, base class removed.

### Output
Raw breakage list.

### Quality Gate
- The griffe command line and its full output are in the report.
- Breakage count in the report equals the number of output lines griffe printed.

---

## Phase 2: Review Each Breakage

### Entry Criteria
- Phase 1 ran.

### Actions
1. For each breakage, check whether the object is public: it is in a module's `__all__` in `py_export_surface`, or the old release exposed it (shipped leak). A breakage on a name that starts with `_` and was never in `__all__` is internal; mark it `ignored_private` with that reason.
2. Do not mark a public breakage as ignorable because "nobody uses it". Only the privacy rule in step 1 can exclude a breakage.
3. Note what griffe cannot see: behavior changes (a function now raises a different exception, returns sorted output, changes a default timeout read from the environment). Read `git log --oneline <ref>..HEAD` and list commits that describe behavior changes to public functions; ask the user to classify each one as breaking or not.

### Output
Reviewed breakage list plus behavior-change questions.

### Quality Gate
- Every breakage is `public_breaking` or `ignored_private` with the `__all__` evidence.
- Every behavior-change commit is listed with the user's classification or as an open question.

---

## Phase 3: Find Additions and Decide the Class

### Entry Criteria
- Phase 2 done (or first release).

### Actions
1. Compute additions: check out the old `__all__`: `git show <ref>:src/<pkg>/__init__.py | grep -A50 "__all__"` and compare with the current list. New names are additions. New optional keyword parameters with defaults on public functions are also additions.
2. Decide with this table, first match wins:

   | # | Condition | `py_change_class` |
   |---|---|---|
   | 1 | No previous release | initial |
   | 2 | Any `public_breaking` row, or any behavior change the user classed as breaking | major |
   | 3 | Any addition, or any new deprecation warning | minor |
   | 4 | Any code change in the package since the ref (`git diff --quiet <ref> -- src/` exits 1) | patch |
   | 5 | Nothing changed in the package | none |

3. `pkg-release-version-lock` applies the 0.x rules; do not adjust the class here for 0.x versions.

### Output
`py_change_class`, `py_api_diff`.

### Quality Gate
- The table row number is recorded next to the class.
- For rows 3 and 4, the evidence (added names or `git diff --stat` output) is in the report.

---

## Worked Example

Illustrative. `tinyretry`, `previous_release_ref = v0.4.1`.

Phase 1:
```
$ griffe check tinyretry -s src --against v0.4.1
src/tinyretry/_core.py:31: retry(max_tries): Parameter was removed
src/tinyretry/_core.py:31: retry(attempts): Parameter kind was changed: positional or keyword -> keyword-only
src/tinyretry/utils.py:0: sleep_for_tests: Public object was removed
```

Phase 2: `max_tries` and `attempts` changes are on `retry`, which is in `__all__`: `public_breaking`. `utils.sleep_for_tests` shipped in 0.4.1 under a public module path: `public_breaking`.

Phase 3: added name `backoff`. Table row 2 applies: `py_change_class = major`.

---

## Exit Criteria

DONE when every griffe breakage is reviewed, behavior changes are classified by the user, additions are listed, and the change class cites its table row.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `previous_release_ref` not found | **Stop**: ask for the correct tag; `git tag --list` shows candidates. |
| Phase 1 | griffe cannot load the old version (import-time error) | **Adjust**: run with `--search` pointing at the old layout path, or compare `__all__` by hand and record the reduced coverage. |
| Phase 2 | Breakage looks accidental | **Return**: report it to the user to fix in code; do not downgrade the class. |
| Phase 3 | User has not classified a behavior change | **Stop**: the class cannot be final until they answer. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
