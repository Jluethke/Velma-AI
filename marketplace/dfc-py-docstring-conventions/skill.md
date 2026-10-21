# Python Docstring Conventions With Ruff and pydoclint

**One-line description:** Picks one Python docstring convention (Google, NumPy or PEP 257) from what the code already uses, enforces it with Ruff's pydocstyle `D` rules and checks that documented arguments, returns and raises match the signatures with pydoclint, then fills missing docstrings on the public API one module at a time.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root (contains `pyproject.toml`).
- `docstring_style` (string, optional): `google`, `numpy` or `pep257`. When absent, detected in Phase 1.

---

## Outputs

- `docstring_config` (string): The `pyproject.toml` sections added or changed (`[tool.ruff.lint]`, `[tool.ruff.lint.pydocstyle]`, `[tool.pydoclint]`).
- `docstring_report` (object[]): Per module: public items, items missing docstrings before and after, Ruff `D` violations before and after, pydoclint violations before and after.

---

## Phase 1: Detect the Convention

### Entry Criteria
- `ruff --version` prints a version (install with `pip install ruff` into the project environment if missing).
- Source lives in a known package directory (`src/<pkg>` or `<pkg>`).

### Actions
1. If `docstring_style` is given, use it and skip to step 4.
2. Count existing section styles:
   - Google: `git grep -c -E '^\s+(Args|Returns|Raises|Yields):$' -- '*.py' | awk -F: '{s+=$2} END {print s}'`
   - NumPy: `git grep -c -E '^\s+(Parameters|Returns|Raises)$' -- '*.py'` followed by an underline line of dashes; confirm with `git grep -n -A1 -E '^\s+Parameters$' -- '*.py' | grep -c -- '----'`
3. Decide:

   | Counts | Convention |
   |---|---|
   | Google count greater than NumPy count | `google` |
   | NumPy count greater than Google count | `numpy` |
   | Both zero, project uses Sphinx with `sphinx.ext.napoleon` | `google` (napoleon reads it) |
   | Both zero, no Sphinx | `google` |
   | Project has only one-line docstrings and wants no sections | `pep257` |

4. Record the convention and the counts that chose it.

### Output
Chosen convention with evidence.

### Quality Gate
- The two count commands were run and their numbers are recorded beside the decision.

---

## Phase 2: Configure the Checkers

### Entry Criteria
- Convention chosen.

### Actions
1. Add to `pyproject.toml` (merge with existing `[tool.ruff.lint]` if present; do NOT create a second table with the same name, which is a TOML error):
   ```toml
   [tool.ruff.lint]
   extend-select = ["D"]

   [tool.ruff.lint.pydocstyle]
   convention = "google"

   [tool.ruff.lint.per-file-ignores]
   "tests/**" = ["D"]
   ```
   Setting `convention` makes Ruff disable the `D` rules that conflict with that convention; do not also list those rules by hand.
2. Install pydoclint (`pip install pydoclint`) and configure it:
   ```toml
   [tool.pydoclint]
   style = "google"
   arg-type-hints-in-docstring = false
   check-return-types = false
   ```
   Set `arg-type-hints-in-docstring = false` and `check-return-types = false` when signatures carry type hints, so types are written once (in the signature). Check `pydoclint --help` for the exact option names in the installed version before writing them.
3. Do NOT use darglint; its repository is archived. pydoclint is its maintained replacement.
4. Validate the TOML: `python -c "import tomllib; tomllib.load(open('pyproject.toml','rb'))"` (Python 3.11+; on older Python use `pip install tomli` and `import tomli`).

### Output
`docstring_config`.

### Quality Gate
- The TOML parse command exits 0.
- `ruff check --select D --statistics <pkg_dir>` runs and prints a per-rule table (or nothing when clean) without a configuration error.

---

## Phase 3: Fill and Fix One Module at a Time

### Entry Criteria
- Checkers configured.

### Actions
1. Baseline: `ruff check --select D --statistics <pkg_dir>` and `pydoclint <pkg_dir>`. Record counts per module in `docstring_report`.
2. Work through modules in import order of the public API (start with the package `__init__.py` and the modules it re-exports). Edit ONE module, then rerun both commands on that file only: `ruff check --select D <file>` and `pydoclint <file>`.
3. Google-style template for a function:
   ```python
   def load_schema(path: str, *, strict: bool = True) -> Schema:
       """Load and compile a schema file.

       Args:
           path: Filesystem path to a YAML or JSON schema.
           strict: Reject unknown keys when True.

       Returns:
           The compiled schema.

       Raises:
           FileNotFoundError: If `path` does not exist.
           SchemaError: If the file is not a valid schema.
       """
   ```
   First line: imperative mood, ends with a period, fits on one line (D401, D400 under pydocstyle). Document only exceptions the function raises itself or deliberately lets through as part of its contract.
4. Read the code before writing each docstring. Do NOT describe behavior the code does not have; if unsure what a branch does, write a test for it or ask, never guess.
5. Do NOT change code to satisfy a docstring rule, apart from adding the docstring itself. Never rename parameters.
6. Run the project's tests after each module: `pytest -q`. Docstrings can break doctests.

### Output
`docstring_report` with before and after counts.

### Quality Gate
- `ruff check --select D <pkg_dir>; echo $?` prints `0` as its last line.
- `pydoclint <pkg_dir>; echo $?` prints `0` as its last line.
- `pytest -q` passes with the same test count as before Phase 3.

---

## Worked Example

Illustrative only. Phase 1:
```
$ git grep -c -E '^\s+(Args|Returns|Raises|Yields):$' -- '*.py' | awk -F: '{s+=$2} END {print s}'
37
$ git grep -n -A1 -E '^\s+Parameters$' -- '*.py' | grep -c -- '----'
0
```
Convention `google`.

Phase 3 baseline:
```
$ ruff check --select D --statistics src/tidyconf
14  D103  [ ] Missing docstring in public function
 5  D417  [ ] Missing argument descriptions in the docstring
 2  D401  [ ] First line of docstring should be in imperative mood
$ pydoclint src/tidyconf
src/tidyconf/schema.py
    42: DOC101: Function `load_schema`: Docstring contains fewer arguments than in function signature.
```
After fixing `schema.py` alone, `ruff check --select D src/tidyconf/schema.py` prints `All checks passed!` and pydoclint reports nothing for that file. Repeat per module.

---

## Exit Criteria

DONE when one convention is configured in `pyproject.toml`, Ruff `D` rules and pydoclint both exit 0 on the package, and the test suite passes with an unchanged test count.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Mixed styles with near-equal counts | **Return**: report both counts and ask the user to pick; do not convert both styles in one pass. |
| Phase 2 | Ruff version too old for `[tool.ruff.lint]` table | **Adjust**: upgrade Ruff in the project environment, or use the older top-level keys documented for the installed version. |
| Phase 3 | pydoclint flags a raise that happens in a callee | **Adjust**: document it only if callers are meant to handle it; otherwise leave it out and record the decision. |
| Phase 3 | Tests fail after adding a docstring | **Stop**: a doctest example in the new docstring is wrong; fix the example, never the test count. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
