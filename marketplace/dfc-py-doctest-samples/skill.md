# Python Executable Doc Samples With pytest Doctest

**One-line description:** Makes every Python code sample in docstrings and Markdown or reST pages run as a test, using `pytest --doctest-modules` for `>>>` examples in code, `--doctest-glob` for `>>>` examples in doc pages, and the `pytest-markdown-docs` plugin for plain fenced Python blocks, with a fixed policy for output that legitimately varies.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `docstring_report` (object[], required): Result of `dfc-py-docstring-conventions`; tells which modules now carry examples.

---

## Outputs

- `sample_test_command` (string): The single command CI runs to execute all doc samples.
- `sample_test_report` (object[]): Per file: sample count, passed, failed before fix, failure class and fix, and every `+SKIP` with its reason.

---

## Phase 1: Inventory Samples by Kind

### Entry Criteria
- `pytest --version` prints a version in the project environment.
- The package is installed in that environment (`pip install -e .`).

### Actions
1. Count `>>>` examples in code: `git grep -c '>>> ' -- 'src/*.py' '*.py'`.
2. Count `>>>` examples in doc pages: `git grep -c '>>> ' -- '*.md' '*.rst'`.
3. Count plain fenced Python blocks in Markdown: `git grep -c -E '^```(python|py)$' -- '*.md'`.
4. Choose the runner per kind:

   | Kind | Runner |
   |---|---|
   | `>>>` in docstrings | `pytest --doctest-modules src/<package>` |
   | `>>>` in `.md` / `.rst` / `.txt` pages | `pytest --doctest-glob='*.md' --doctest-glob='*.rst' docs README.md` |
   | Fenced `python` blocks without `>>>` | `pip install pytest-markdown-docs`, then `pytest --markdown-docs docs README.md` (confirm the flag with `pytest --help \| grep markdown`) |
   | Sphinx project with `.. doctest::` directives | `sphinx-build -b doctest docs docs/_build/doctest` (requires `sphinx.ext.doctest` in `extensions`) |

### Output
Sample counts per kind with the chosen runner.

### Quality Gate
- Every kind with a non-zero count has a runner selected.

---

## Phase 2: Configure and Run

### Entry Criteria
- Runners chosen.

### Actions
1. Add shared doctest options in `pyproject.toml`:
   ```toml
   [tool.pytest.ini_options]
   doctest_optionflags = ["NORMALIZE_WHITESPACE", "ELLIPSIS"]
   ```
   `ELLIPSIS` lets `...` in expected output match any text; `NORMALIZE_WHITESPACE` treats runs of whitespace as equal.
2. Do NOT add `--doctest-modules` to `addopts` if any module has import-time side effects (connects to a database, reads env vars and exits); run it as a separate command instead.
3. Run each runner separately first and record failures: for example `pytest --doctest-modules src/tidyconf -q 2>&1 | tail -30`.
4. Classify each failure:

   | Failure | Class | Fix |
   |---|---|---|
   | `Expected: ... Got: ...` with a real difference | Sample is wrong or code changed | Fix the sample to match the current behavior after confirming the behavior is intended |
   | Object repr with memory address (`<Foo at 0x7f...>`) | Unstable output | Replace with `<Foo ...>` (ELLIPSIS) or print a stable attribute |
   | Dict or set order differs | Unstable output | Print `sorted(...)` |
   | Timestamps, random values, paths | Unstable output | Seed or fix the value in the sample, or use `...` |
   | `NameError` | Sample relies on an earlier, unshown import | Add the import line to the sample |
   | Needs network or credentials | Cannot run in CI | Mark the line `# doctest: +SKIP` and record why |

5. Do NOT delete a failing sample or add `+SKIP` to failures in the "sample is wrong" class. Fix the sample.

### Output
Failure classes and fixes recorded.

### Quality Gate
- Each runner from Phase 1 exits 0 when run alone.
- `git grep -c 'doctest: +SKIP'` equals the count of SKIP rows in `sample_test_report`.

---

## Phase 3: One CI Command

### Entry Criteria
- All runners pass separately.

### Actions
1. Combine into one command, for example:
   `pytest --doctest-modules src/tidyconf --doctest-glob='*.md' docs README.md`
   Add `--markdown-docs` when that plugin is used.
2. Run it twice in a row; doctests that pass once and fail once have hidden state.
3. Record the final command as `sample_test_command`.

### Output
`sample_test_command`, `sample_test_report`.

### Quality Gate
- The command in `sample_test_command` exits 0 on two consecutive runs.
- The pytest summary line reports a passed count equal to the total sample count from Phase 1 minus SKIP rows (doctest counts one test per docstring or file, so compare per-file when counts differ).

---

## Worked Example

Illustrative only. Phase 1: 12 docstring examples in `src/tidyconf`, 4 `>>>` blocks in `README.md`.

Phase 2:
```
$ pytest --doctest-modules src/tidyconf -q
F.....
___ [doctest] tidyconf.schema.load_schema ___
Expected:
    {'port': 'int', 'name': 'str'}
Got:
    {'name': 'str', 'port': 'int'}
1 failed, 5 passed
```
Class: unstable output (dict order). The sample changes to `>>> sorted(schema.fields.items())` with expected `[('name', 'str'), ('port', 'int')]`.

Phase 3:
```
$ pytest --doctest-modules src/tidyconf --doctest-glob='*.md' README.md -q
7 passed in 0.41s
```

---

## Exit Criteria

DONE when every Python sample in code and docs runs under one command that exits 0 twice in a row, with every skip justified in `sample_test_report`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Package not installed, imports fail | **Stop**: install with `pip install -e .`; do not add `sys.path` manipulation to `conftest.py`. |
| Phase 2 | Module import has side effects under `--doctest-modules` | **Adjust**: add the module to `--ignore=<path>` and move its examples to a doc page tested with `--doctest-glob`; record it. |
| Phase 2 | Sample reveals a real bug in the code | **Return**: report the bug with the failing sample; do not change the sample to match buggy output. |
| Phase 3 | Second run fails | **Adjust**: find shared state (files written, globals) and make the sample clean up after itself. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
