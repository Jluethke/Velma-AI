# Python API Reference With Sphinx autodoc

**One-line description:** Generates a Python package's API reference with Sphinx `autodoc`, `autosummary` and `napoleon` from the installed package, and builds it with warnings as errors and nitpicky cross-reference checking until `sphinx-build -W --keep-going -n` exits 0.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `docstring_report` (object[], required): Result of `dfc-py-docstring-conventions`; its convention decides the napoleon settings and its after-counts must be zero.

---

## Outputs

- `api_reference_dir` (string): Directory holding the reference source pages (for example `docs/reference/api/`) and the built HTML path (`docs/_build/html`).
- `api_build_log` (object[]): Final build warnings by category before and after, with the fix applied to each category.

---

## Phase 1: Set Up Sphinx Against the Installed Package

### Entry Criteria
- `docstring_report` shows zero remaining violations.
- A virtual environment is active (`python -c "import sys; print(sys.prefix != sys.base_prefix)"` prints `True`).

### Actions
1. Install the package and Sphinx into the same environment: `pip install -e . sphinx`. Add the theme only if the project uses one (for example `pip install furo`).
2. Do NOT add `sys.path.insert(0, os.path.abspath('../src'))` to `conf.py` when the package is installed. The editable install makes autodoc import exactly what users import; a path hack hides missing package data and broken imports.
3. If `docs/conf.py` does not exist, run `sphinx-quickstart docs --sep -p <project> -a "<author>" -l en --no-makefile --no-batchfile` and keep its output. Check `sphinx-quickstart --help` for flags on the installed version.
4. Set these values in `conf.py`:
   ```python
   extensions = [
       "sphinx.ext.autodoc",
       "sphinx.ext.autosummary",
       "sphinx.ext.napoleon",
       "sphinx.ext.intersphinx",
       "sphinx.ext.viewcode",
   ]
   autosummary_generate = True
   autodoc_typehints = "description"
   autodoc_member_order = "bysource"
   napoleon_google_docstring = True
   napoleon_numpy_docstring = False
   intersphinx_mapping = {"python": ("https://docs.python.org/3", None)}
   ```
   Swap the two napoleon booleans when the convention is `numpy`. With `--sep`, `conf.py` is in `docs/source/`; adjust paths below accordingly.

### Output
Sphinx project configured.

### Quality Gate
- `python -c "import <package>; print(<package>.__file__)"` prints a path inside `repo_path` (editable install in effect).
- `grep -n "sys.path.insert" docs/conf.py docs/source/conf.py 2>/dev/null` prints nothing.

---

## Phase 2: Generate Reference Pages

### Entry Criteria
- Configuration done.

### Actions
1. Choose one generation method. Do NOT use both; it produces "duplicate object description" warnings:

   | Situation | Method |
   |---|---|
   | Package has an `__all__` per public module and you want one page per module | `autosummary` with a recursive entry point (step 2) |
   | No `__all__`, many modules, quick start | `sphinx-apidoc -f -e -M -o docs/reference/api src/<package>` (`-e` one page per module, `-M` module docs before submodules) |

2. autosummary entry page `docs/reference/api/index.rst`:
   ```rst
   API reference
   =============

   .. autosummary::
      :toctree: generated
      :recursive:

      tidyconf
   ```
3. Add `reference/api/index` to the root `toctree` in `docs/index.rst`.
4. Add `generated/` (autosummary output) to `.gitignore`; it is rebuilt on every build.

### Output
Reference source pages and toctree entry.

### Quality Gate
- `grep -rn "reference/api/index" docs/index.rst` prints a line.

---

## Phase 3: Build Strictly and Fix Warnings

### Entry Criteria
- Reference pages exist.

### Actions
1. Build: `sphinx-build -W --keep-going -n -b html docs docs/_build/html 2>&1 | tee /tmp/sphinx.log`. `-W` turns warnings into errors, `--keep-going` reports all of them in one run, `-n` (nitpicky) warns on every unresolved cross-reference.
2. Count by category: `grep -o -E 'WARNING: [^:]+' /tmp/sphinx.log | sort | uniq -c | sort -rn`.
3. Fix by category with this table:

   | Warning text | Cause | Fix |
   |---|---|---|
   | `autodoc: failed to import module` | Package not importable in this environment, or optional dependency missing | Install the dependency; for heavy optional imports set `autodoc_mock_imports = ["<module>"]` |
   | `py:class reference target not found: <name>` | Type in a signature has no documented target | Add the library to `intersphinx_mapping`; for private or third-party types with no inventory, add `("py:class", "<name>")` to `nitpick_ignore` and record it |
   | `duplicate object description` | Same object documented twice | Remove one source (apidoc page or autosummary entry) |
   | `document isn't included in any toctree` | Orphan page | Add it to a toctree, or put `:orphan:` at the top if intentional |
   | `Unexpected indentation` / `Block quote ends without a blank line` | reST syntax error inside a docstring | Fix the docstring in the source file named by the warning |

4. Fix one category per rebuild. Do NOT remove `-W` or `-n` to get a green build; every `nitpick_ignore` entry is listed in `api_build_log`.

### Output
`api_build_log`; HTML in `docs/_build/html`.

### Quality Gate
- `sphinx-build -W --keep-going -n -b html docs docs/_build/html; echo $?` prints `0` last.
- `ls docs/_build/html/reference/api/` lists generated pages (path follows the Phase 2 layout).

---

## Worked Example

Illustrative only. First build:
```
$ sphinx-build -W --keep-going -n -b html docs docs/_build/html
...
WARNING: autodoc: failed to import module 'tidyconf.remote'; the following exception was raised:
No module named 'boto3'
/src/tidyconf/schema.py:docstring of tidyconf.schema.load_schema:1: WARNING: py:class reference target not found: pathlib.Path
build finished with problems, 2 warnings (with warnings treated as errors).
```
Fixes: `boto3` is an optional extra, so `autodoc_mock_imports = ["boto3"]`; `pathlib.Path` resolves once `intersphinx_mapping` includes Python (it was missing). Rebuild ends with `build succeeded.` and exit code 0.

---

## Exit Criteria

DONE when the reference is generated from the installed package with one generation method, and the strict nitpicky build exits 0 with every suppression recorded in `api_build_log`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `docstring_report` still has violations | **Return**: send the package back to `dfc-py-docstring-conventions`; reST errors in docstrings become build errors here. |
| Phase 1 | Package cannot be installed editable (no build backend) | **Stop**: report the packaging defect; do not fall back to a `sys.path` hack. |
| Phase 3 | intersphinx cannot fetch inventories (offline CI) | **Retry**: once; then **Adjust** by caching `objects.inv` files and pointing `intersphinx_mapping` at the local paths. |
| Phase 3 | Warnings come from a third-party base class's docstring | **Adjust**: set `:inherited-members:` off for that class or add a targeted `nitpick_ignore`; record it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
