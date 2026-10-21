# Port Behavior Surface Inventory

**One-line description:** Lists every externally observable behavior of the source program before any porting starts (public functions, CLI commands, HTTP routes, files read and written, environment variables, exit codes and output formats), using language-specific extraction commands, so the port has a closed list of behaviors to reproduce.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Absolute path to the repository being ported, checked out at the exact commit that will be treated as the reference.
- `stack` (string, required): Port pair. One of `py-ts`, `py-go`, `js-ts`, `java-kotlin`, `c-rust`.
- `entry_points` (string[], optional): Entry points the user already knows about (module paths, CLI names, route prefixes). Used as a cross-check, never as the full list.

---

## Outputs

- `behavior_inventory` (object[]): One row per behavior with: `id` (B-001 style), `kind` (function, method, cli, route, file_io, env_var, exit_code, stdout_format, stderr_format, config_file), `name`, `location` (file:line), `signature_or_shape`, `callers_outside_repo` (yes, no, unknown), `existing_tests` (count), `in_scope` (yes or no with reason).

---

## Phase 1: Pin the Reference

### Entry Criteria
- `source_repo` exists and is a git working tree.
- `stack` is one of the five allowed values.

### Actions
1. Run `git -C <source_repo> status --porcelain`. If it prints anything, stop: the reference must be a clean commit.
2. Run `git -C <source_repo> rev-parse HEAD` and record the full hash as `reference_commit`.
3. Record the exact runtime version, because outputs depend on it:
   - Python: `python --version` and `python -c "import sys; print(sys.version)"`.
   - JavaScript: `node --version` and `node -p "process.versions.icu"` (ICU data changes `Intl` and `toLocaleString` output).
   - Java: `java -version` (stderr). JDK 18 made UTF-8 the default charset (JEP 400) and JDK 19 changed `Double.toString` output for some values (JDK-4511638), so the major version matters.
   - C: `cc --version` and `cc -dM -E - < /dev/null | grep -E "__SIZEOF_INT__|__SIZEOF_LONG__|__SIZEOF_POINTER__|__CHAR_UNSIGNED__"`. A missing `__CHAR_UNSIGNED__` line means plain `char` is signed on this target.
4. Count the existing tests so later phases can say what they protect:
   - Python: `pytest --collect-only -q | tail -n 1`.
   - JavaScript: read `package.json` `scripts.test`, then run it with the runner's list option (for Vitest `npx vitest list`, for Jest `npx jest --listTests`).
   - Java: `mvn -q test` or `./gradlew test`, then count `<testcase` elements in `target/surefire-reports/*.xml` or `build/test-results/test/*.xml`.
   - C: read the `test` target in the `Makefile` or `ctest -N` output in a CMake build directory.

### Output
`reference_commit`, runtime versions, and test count, written at the top of the inventory.

### Quality Gate
- `git status --porcelain` printed nothing.
- `reference_commit` is a 40-character hash.
- Every runtime version line was copied from real command output, not typed from memory.

---

## Phase 2: Extract the Public Surface

### Entry Criteria
- Phase 1 complete.

### Actions
1. Run the extraction for the source language. Paste raw output into a scratch file outside the repo.

| Source language | Public functions and types | Entry points |
|---|---|---|
| Python | `python -c "import importlib,inspect; m=importlib.import_module('PKG'); print('\n'.join(n for n,_ in inspect.getmembers(m) if not n.startswith('_')))"` for each package; prefer `__all__` when the module defines it | `[project.scripts]` in `pyproject.toml`, `console_scripts` in `setup.cfg`, `if __name__ == "__main__":` blocks (`rg -n "__name__ == .__main__." --type py`); Flask: `flask --app APP routes`; FastAPI: print `[r.path for r in app.routes]`; Django: `python manage.py show_urls` only if django-extensions is installed |
| JavaScript | `rg -n "^export |module\.exports|exports\.[A-Za-z_]+ *=" --type js` | `main`, `exports`, `bin` in `package.json`; Express routes: `rg -n "\.(get|post|put|patch|delete)\(['\"]/" --type js` |
| Java | `javap -public -cp target/classes com.example.Foo` per public class; list classes with `jar tf app.jar` | `public static void main` (`rg -n "static void main\(" --type java`); Spring: `rg -n "@(Get|Post|Put|Delete|Patch|Request)Mapping" --type java` |
| C | Prototypes in public headers: `ctags -x --c-kinds=p include/*.h` (Universal Ctags); exported symbols: `nm -D --defined-only libfoo.so` or `nm -g --defined-only libfoo.a` | `int main(` (`rg -n "\bint main\s*\(" --type c`) |

2. Find the hidden surface that callers depend on but signatures do not show:
   - Environment variables: Python `rg -n "os\.environ|os\.getenv"`, JS `rg -n "process\.env"`, Java `rg -n "System\.getenv|System\.getProperty"`, C `rg -n "getenv\("`.
   - Files: Python `rg -n "open\(|Path\(.*\)\.(read|write)_"`, JS `rg -n "fs\.(read|write|append|createReadStream|createWriteStream)"`, Java `rg -n "Files\.(read|write|newBuffered)|FileInputStream|FileOutputStream"`, C `rg -n "fopen\(|open\("`.
   - Exit codes: Python `rg -n "sys\.exit\("`, JS `rg -n "process\.exit\("`, Java `rg -n "System\.exit\("`, C `rg -n "exit\(|return [0-9]+;" src/main.c`.
   - Output formats: every `print(`, `console.log(`, `System.out`, `printf(` reachable from an entry point. Record whether the format is user-facing (parsed by someone) or diagnostic.
3. Write one row per item into `behavior_inventory`. Give each a stable id `B-001`, `B-002`, and so on.

### Output
Draft `behavior_inventory` with every extracted item.

### Quality Gate
- The row count is at least the number of lines in the raw extraction output for public functions (every extracted name has a row).
- Every item in `entry_points` (when given) appears as a row; any that does not exist in the code is reported, not silently dropped.
- Every row has a `location` that opens to a real line (`sed -n '<line>p' <file>` prints the definition).

---

## Phase 3: Decide Scope and Callers

### Entry Criteria
- Draft inventory exists.

### Actions
1. For each row, decide `callers_outside_repo` with this table:

| Evidence | Value |
|---|---|
| Listed in `__all__`, `exports`, a public header, or is `public` in a published jar | yes |
| Prefixed `_` (Python), not exported (JS), package-private (Java), `static` in a `.c` file (C) | no |
| Published package but no export marker | unknown |

2. Mark `in_scope = no` only when the user confirms the behavior is dead. Use `rg -n "<name>"` across the repo; zero hits outside the definition is evidence, not proof (reflection, `getattr`, dynamic imports, and `dlsym` hide callers). Ask the user for every `unknown`.
3. Count `existing_tests` per row with `rg -c "<name>" tests/` (or the language test dir). A behavior with zero tests is a corpus priority, not a reason to drop it.

### Output
Final `behavior_inventory`.

### Quality Gate
- Zero rows have an empty `in_scope`.
- Every `in_scope = no` row cites the user's confirmation.
- Rows with `existing_tests = 0` are listed in a separate section headed "Untested behaviors".

---

## Worked Example

Illustrative. Input: `source_repo=/work/slugkit` (Python), `stack=py-go`, `entry_points=["slugkit.slugify"]`.

Phase 1:
```
$ git -C /work/slugkit rev-parse HEAD
4f1c2a9e0b7d3c5a8e6f1b2d4c7a9e0f1b3d5c7a
$ python --version
Python 3.12.4
$ pytest --collect-only -q | tail -n 1
41 tests collected in 0.22s
```

Phase 2 extraction found `slugify`, `unslugify`, `MAX_LEN`, a CLI `slugkit` in `[project.scripts]`, env var `SLUGKIT_SEPARATOR` read in `config.py:12`, and `sys.exit(2)` on bad arguments in `cli.py:48`.

Phase 3 rows (excerpt):
```
B-001 function slugify(text: str, max_len: int = 80) -> str  slugkit/core.py:20  callers=yes tests=29 in_scope=yes
B-004 env_var SLUGKIT_SEPARATOR default "-"                     slugkit/config.py:12 callers=yes tests=0  in_scope=yes
B-006 exit_code 2 on argparse error                             slugkit/cli.py:48   callers=yes tests=0  in_scope=yes
```
Untested behaviors: B-004, B-006.

---

## Exit Criteria

DONE when the reference commit is pinned, every public, hidden, and entry-point behavior has a row with a location and scope decision, and untested behaviors are listed separately.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Working tree is dirty | **Stop**: ask the user to commit or stash; a moving reference makes every golden output meaningless. |
| Phase 1 | Runtime version differs from production | **Adjust**: record both; capture goldens on the production version (install it with pyenv, nvm, sdkman, or the distro compiler). |
| Phase 2 | Extraction tool not installed (`ctags`, `rg`, `javap`) | **Adjust**: install it (`pip`, `npm`, package manager, or the JDK `bin` dir); do not hand-list symbols. |
| Phase 2 | Dynamic dispatch hides callers (`getattr`, `require(variable)`, reflection, `dlsym`) | **Adjust**: grep for the dynamic call sites and mark affected rows `callers_outside_repo = unknown`. |
| Phase 3 | User cannot confirm whether a behavior is used | **Return**: keep it in scope; porting an unused behavior costs less than dropping a used one. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
