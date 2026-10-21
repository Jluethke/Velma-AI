# Python CI Gate on Zero Type Errors

**One-line description:** Adds a required CI job that installs the project with its pinned checker, fails on any mypy or pyright error and any unused ignore, fails when any-exprs coverage drops below the committed floor, runs the checker as a local pre-commit hook (not the isolated mirrors-mypy environment), and uses mypy-baseline as an interim ratchet when errors remain.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `migration_profile` (object, required): Supplies `checker`, `checker_version`, `install_command`, `check_command`, `ci_provider`, `language_version`.
- `py_type_coverage` (object, optional): Baseline from `tsm-py-type-coverage`; supplies the coverage command and headline figure.
- `py_boundary_validators` (object[], optional): From `tsm-py-pydantic-boundaries`; their tests run in the required test job.
- `ci_platform` (string, optional): Overrides `migration_profile.ci_provider`.

---

## Outputs

- `py_ci_gate` (object): CI file path and job name, pinned checker and Python versions, the gate mode (zero-error or baseline ratchet), the coverage floor and the command that enforces it, the pre-commit hook config, and the logs of one deliberately failing and one passing run.

---

## Phase 1: Pin and Choose the Mode

### Entry Criteria
- The checker is a dev dependency.

### Actions
1. Pin the checker exactly (`mypy==1.11.2`, `pyright==1.1.38x`), and pin every `types-*` stub and `pydantic` (the mypy plugin's behavior follows the pydantic version). Update the lock file.
2. Run the checker with the committed config and read the count. Choose the mode:

   | Errors | Mode |
   |---|---|
   | 0 | zero-error: the checker must exit 0. |
   | Greater than 0, mypy | baseline ratchet with `mypy-baseline` (below). |
   | Greater than 0, pyright | Return to `tsm-py-pyright-strict`: that flow keeps the committed config at 0 errors by design (strict applies only to clean paths). |

3. Baseline ratchet for mypy: install `mypy-baseline` pinned and read `mypy-baseline --help` for the installed version's subcommands. The documented workflow is `mypy | mypy-baseline sync` to write `mypy-baseline.txt` (commit it) and `mypy | mypy-baseline filter` in CI, which prints and fails on errors not in the file. Fixed errors must be removed from the file by running `sync` again, so the file only shrinks.
4. Coverage floor: write it into `pyproject.toml` (not into the workflow file) under a project-specific table the gate reads, for example `[tool.typecov] min_any_exprs_coverage = 96.75` (the `py_type_coverage` headline after the migration, or the baseline headline if run earlier). The gate step compares the `Total` row of `any-exprs.txt` against that number. If `py_type_coverage` is absent, run `tsm-py-type-coverage` first; never invent a floor.

### Output
Pins, mode, floor.

### Quality Gate
- `grep -E "^\s*\"?(mypy|pyright)\s*==" pyproject.toml requirements*.txt 2>/dev/null` (or the lock file) shows an exact pin.
- In ratchet mode, `mypy | mypy-baseline filter` exits 0 on the current commit.

---

## Phase 2: Write the CI Job and Pre-commit Hook

### Entry Criteria
- Phase 1 complete.

### Actions
1. GitHub Actions, `.github/workflows/typecheck.yml` (uv shown; replace the install steps with `pip install -e ".[dev]"` or `poetry install` from `migration_profile.install_command`):
   ```yaml
   name: typecheck
   on:
     pull_request:
     push:
       branches: [main]
   jobs:
     typecheck:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: astral-sh/setup-uv@v3
         - run: uv python install 3.12
         - run: uv sync --frozen
         - run: uv run mypy
         - run: uv run ruff check src
         - name: any-exprs coverage floor
           run: |
             uv run mypy --any-exprs-report .cov >/dev/null || true
             total=$(awk '/Total/ {gsub("%","",$NF); print $NF}' .cov/any-exprs.txt)
             floor=$(uv run python -c "import tomllib;print(tomllib.load(open('pyproject.toml','rb'))['tool']['typecov']['min_any_exprs_coverage'])")
             echo "coverage=$total floor=$floor"
             uv run python -c "import sys; sys.exit(0 if float('$total') >= float('$floor') else 1)"
   ```
   The `|| true` on the report run is there because type errors are already enforced by the `mypy` step; the coverage step must not double-report them. For pyright replace `uv run mypy` with `uv run pyright` (exit 1 on any error) and, for libraries, gate on `pyright --verifytypes <pkg> --ignoreexternal --outputjson` `typeCompleteness.completenessScore` the same way. In ratchet mode replace the mypy step with `uv run mypy | uv run mypy-baseline filter`. GitHub's default shell on Linux runners is `bash -e {0}` without `pipefail` unless `shell: bash` is set explicitly (which runs `bash --noprofile --norc -eo pipefail {0}`); the pipeline's exit code is the last command's (`filter`), which is the one that must fail on new errors, so confirm it in Phase 3.
2. Use the same Python minor as `language_version`; a different minor changes stdlib stubs and therefore errors.
3. GitLab CI: one job with `image: python:<minor>`, the same commands in `script:`, and a `rules:` entry for merge request pipelines.
4. Pre-commit (optional, local feedback only; CI stays the gate). Use a local hook so mypy sees the project's installed dependencies and stubs:
   ```yaml
   repos:
     - repo: local
       hooks:
         - id: mypy
           name: mypy
           entry: mypy
           language: system
           types: [python]
           pass_filenames: false
   ```
   `pass_filenames: false` makes mypy check the configured `files`, not only staged files, which avoids false results from partial module sets. The public `mirrors-mypy` hook runs in an isolated environment without the project's dependencies unless every one is listed under `additional_dependencies`; it then reports wrong `import-untyped` errors or misses real ones.
5. Commit `ci: add typecheck gate`.

### Output
CI file and hook committed.

### Quality Gate
- The workflow ran on the branch and passed; its log prints the `coverage=... floor=...` line.
- `pre-commit run mypy --all-files` (if configured) exits 0.

---

## Phase 3: Prove It Fails and Make It Required

### Entry Criteria
- The job passes on the branch.

### Actions
1. Throwaway branch: add `x: int = "a"` to a strict module; confirm the job fails at the checker step with `[assignment]` (mypy) or `reportAssignmentType` / `reportGeneralTypeIssues` (pyright, rule name depends on version). Delete the branch.
2. Throwaway branch: add `# type: ignore` (bare) on a clean line; confirm failure (`unused-ignore` from mypy with `warn_unused_ignores`, or ruff `PGH003`). Delete the branch.
3. Throwaway branch: lower coverage by adding a function `def f(x): return x` in an unannotated legacy module if any remains, or temporarily raise the floor by a hundredth in the branch; confirm the coverage step fails. Delete the branch.
4. Ask the user to mark the job required in branch protection or rulesets, and record their confirmation.

### Output
`py_ci_gate`.

### Quality Gate
- Three recorded failing runs, each failing at the expected step with the expected code.
- One recorded passing run on the migration branch.
- User confirmation of the required check recorded, or listed as open.

---

## Worked Example

Illustrative only. GitHub Actions, uv, mypy 1.11.2, zero-error mode, floor 96.75.

Phase 2 passing run log:
```
Success: no issues found in 120 source files
All checks passed!
coverage=96.75 floor=96.75
```
Phase 3, branch `gate-probe-1`:
```
src/billing/money.py:3: error: Incompatible types in assignment (expression has type "str", variable has type "int")  [assignment]
Found 1 error in 1 file (checked 120 source files)
Error: Process completed with exit code 1.
```
Branch `gate-probe-2` fails with `error: Unused "type: ignore" comment  [unused-ignore]`. Branch `gate-probe-3` (floor raised to 96.76) prints `coverage=96.75 floor=96.76` and exits 1. User confirms the required check.

---

## Exit Criteria

DONE when CI pins the checker and Python minor, fails on any type error, unused ignore or coverage drop, has been shown to fail on each, and the user confirmed it is required.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Local and CI counts differ | **Adjust**: compare checker version, Python minor and installed stub versions between the two; fix the pins. |
| Phase 2 | mypy in pre-commit reports import errors that CI does not | **Adjust**: the hook is isolated; switch to the `repo: local`, `language: system` hook. |
| Phase 3 | The deliberate error does not fail the job | **Stop**: the gate is not running the check (wrong `files`, a pipe swallowing the exit code); fix before declaring done. |
| Phase 3 | Proposal to mark the step `continue-on-error` | **Stop**: refuse; an advisory gate is not a gate. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
