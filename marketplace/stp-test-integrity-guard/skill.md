# Guard Against Deleted, Skipped or Weakened Tests and Suppressed Checks

**One-line description:** Diffs the working tree and index against the starting commit to prove no test was deleted, skipped, focused (`.only`) or loosened and no check was silenced (`# type: ignore`, `@ts-ignore`, `//nolint`, `#[allow]`, `@SuppressWarnings`, `noqa`), and re-counts tests against the baseline, so a green run cannot come from cheating.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `edit_outcome` (object, required): From `stp-keep-or-revert-edit`. The guard runs after every KEEP or REVERT so a cheat is caught on the edit that introduced it.
- `start_commit` (object, required): From `stp-scratch-log-start`.
- `baseline_report` (object, required): From `stp-baseline-capture` (`test_count`).
- `verify_card` (object, required): From `stp-baseline-capture` (`collect_count`).
- `scratch_log` (string, required): Path from `stp-scratch-log-start` (KEEP lines name the edited files).
- `repo_path` (string, required): Repository root.

---

## Outputs

- `integrity_report` (object): `{ "verdict": "PASS"|"FAIL", "deleted_test_files": [str], "added_skip_or_focus": [str], "removed_assertions": [str], "added_suppressions": [str], "config_changes": [str], "test_count_before": int|null, "test_count_after": int|null }`.

---

## Phase 1: Diff Against the Start Commit

### Entry Criteria
- `start_commit.is_git` is true. (Non-git: compare each edited file with its `.bak` using `git diff --no-index <bak> <file>`, which works outside a repository.)

### Actions
1. All changes made by the chain, staged and unstaged, excluding the user's pre-existing dirty files: `git -C <repo_path> diff <sha> --name-status`. Remove paths listed in `start_commit.dirty_files`.
2. Deleted or renamed test files: lines with status `D` or `R` whose path matches a test pattern (`test_*.py`, `*_test.py`, `tests/`, `*.test.*`, `*.spec.*`, `__tests__/`, `*_test.go`, `src/test/`, Rust `tests/`). Put them in `deleted_test_files`.
3. Added lines only: `git -C <repo_path> diff <sha> -U0 -- <changed paths> | rg "^\+" | rg -v "^\+\+\+"`.
4. Removed lines only: same with `"^-"` and excluding `"^---"`.

### Output
Changed paths, added lines, removed lines.

### Quality Gate
- The changed path list equals the files edited in `scratch_log` KEEP lines (no unexplained file).

---

## Phase 2: Scan for Skips, Focus, Weakening and Suppression

### Entry Criteria
- Phase 1 outputs exist.

### Actions
1. Scan added lines with these patterns (one `rg -n -e` per row). Every hit goes to `added_skip_or_focus` or `added_suppressions`:

| Stack | Skip or focus patterns | Suppression patterns |
|---|---|---|
| python | `pytest.mark.skip`, `pytest.mark.xfail`, `pytest.skip(`, `unittest.skip`, `@skip` | `# type: ignore`, `# noqa`, `# pragma: no cover`, `# pyright: ignore` |
| node | `\.skip\(`, `\.only\(`, `\bxit\(`, `\bxdescribe\(`, `\bfit\(`, `\bfdescribe\(`, `test\.todo\(` | `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `eslint-disable`, `as any` |
| go | `t\.Skip`, `testing\.Short\(\)` added as a guard | `//nolint`, `//lint:ignore` |
| rust | `#\[ignore\]` | `#\[allow\(`, `#!\[allow\(` |
| java | `@Disabled`, `@Ignore`, `assumeTrue\(`, `Assumptions\.` | `@SuppressWarnings`, `// CHECKSTYLE:OFF`, `@SuppressFBWarnings` |

2. Removed assertions: scan removed lines in test files for `assert`, `expect(`, `t.Error`, `t.Fatal`, `require.`, `assert_eq!`, `assert!`, `assertEquals`, `assertThat`. A removed assertion is allowed only if an added line in the same hunk asserts the same subject with the same or stricter expectation; otherwise list it in `removed_assertions`.
3. Changed expected values: a test line whose expected literal changed (for example `== "creme-brulee"` became `== "crme-brle"`) is a removed assertion. List it.
4. Config changes that loosen checks: any change to `pyproject.toml` `[tool.pytest]`/`[tool.mypy]`/`[tool.ruff]`, `setup.cfg`, `tsconfig.json` (`strict`, `noImplicitAny`, `skipLibCheck`), `.eslintrc*`/`eslint.config.*`, `jest.config.*`/`vitest.config.*` (`testPathIgnorePatterns`, `exclude`), `.golangci.yml`, `Cargo.toml` `[lints]`, `pom.xml`/`build.gradle*` test or check config, CI workflow files. List each in `config_changes`.

### Output
Filled finding lists.

### Quality Gate
- Each finding includes the `file:line` from the diff hunk header and the line text.

---

## Phase 3: Re-count Tests and Decide

### Entry Criteria
- Phase 2 done.

### Actions
1. Run `verify_card.collect_count` again and read the count with the same method as at baseline. Set `test_count_before` from `baseline_report.test_count` and `test_count_after` from this run.
2. Decide:

| Condition | `verdict` |
|---|---|
| any `deleted_test_files`, `added_skip_or_focus`, `removed_assertions`, `added_suppressions` or `config_changes` | FAIL |
| `test_count_after` < `test_count_before` | FAIL |
| counts unreadable (null) and no other finding | PASS with a note that counts could not be compared |
| none of the above | PASS |

3. A FAIL here is final for this run: the stop flow must stop and report. Never "fix" a FAIL by hiding the finding; revert the edit that introduced it instead (its id is in `scratch_log`).
4. Append `INTEGRITY <verdict>: <findings or none>` to the scratch log.

### Output
`integrity_report`.

### Quality Gate
- `verdict` follows the table, and each FAIL cause is a listed finding or a count comparison.

---

## Worked Example

Illustrative only.

slugkit after E1 to E3, start `9f2c4e1`.

```
$ git diff 9f2c4e1 --name-status
M	README.md
M	slugkit/core.py
M	tests/test_slugify.py
$ git diff 9f2c4e1 -U0 -- slugkit/core.py tests/test_slugify.py | rg "^\+" | rg -v "^\+\+\+" | rg -n -e "pytest.mark.skip|xfail|# noqa|type: ignore"
(no output)
$ uv run pytest --collect-only -q | tail -n 1
43 tests collected in 0.12s
```

`README.md` is dropped (pre-existing dirty). No findings; count 42 before, 43 after (one test added). `verdict` PASS.

---

## Exit Criteria

DONE when every change since the start commit is scanned, the test count is compared with the baseline, and `integrity_report.verdict` follows the table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A changed file not explained by any KEEP line | **Stop**: report it; something outside the loop changed the tree. |
| Phase 2 | A suppression was required by the goal itself (user asked for it) | **Return**: record it with the quote from `task_request` in the scratch log; verdict still lists it for the report. |
| Phase 3 | `collect_count` fails now but worked at baseline | **Return**: FAIL; collection breaking is a regression. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
