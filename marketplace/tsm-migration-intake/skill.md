# Type Safety Migration Intake

**One-line description:** Records the stack, exact tool versions, chosen type checker, package manager, test command and a clean git branch before any strict typing migration starts, so every later flow runs the same commands against the same baseline.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root (the directory that holds `package.json` or `pyproject.toml`).
- `stack` (string, required): `typescript` for a JavaScript or TypeScript codebase, `python` for a Python codebase. A repo with both runs the chain once per stack.
- `python_checker` (string, optional): `mypy` or `pyright`. Ignored when `stack` is `typescript`. When absent, Phase 2 derives it from existing config.
- `test_command` (string, optional): The exact command that runs the test suite, for example `npm test` or `pytest -q`. When absent, Phase 1 derives it from the repo.

---

## Outputs

- `migration_profile` (object): `stack`, `repo_path`, `package_manager`, `install_command`, `test_command`, `check_command` (the exact type check command every later flow runs), `checker` (`tsc`, `mypy` or `pyright`), `checker_version`, `language_version`, `source_roots` (list of directories), `config_file` (path of the tsconfig or pyproject section), `ci_provider` (detected CI system or `none`), `branch` (the migration branch name), `test_baseline` (pass and fail counts from one test run).

---

## Phase 1: Detect Stack, Package Manager and Test Command

### Entry Criteria
- `repo_path` exists and is a git work tree: `git -C <repo_path> rev-parse --is-inside-work-tree` prints `true`.
- `stack` is `typescript` or `python`.

### Actions
1. Run `git -C <repo_path> status --porcelain`. If it prints anything, stop: the migration must start from a clean tree so every diff is attributable.
2. Create the migration branch: `git -C <repo_path> switch -c types/strict-migration` (or a name the user gives). Record it as `branch`.
3. Detect the package manager from the lock file at the repo root. Use this table and nothing else:

   | File present | stack | package_manager | install_command |
   |---|---|---|---|
   | `package-lock.json` | typescript | npm | `npm ci` |
   | `pnpm-lock.yaml` | typescript | pnpm | `pnpm install --frozen-lockfile` |
   | `yarn.lock` | typescript | yarn | `yarn install --frozen-lockfile` (Yarn 1) or `yarn install --immutable` (Yarn 2+) |
   | `bun.lockb` or `bun.lock` | typescript | bun | `bun install --frozen-lockfile` |
   | `uv.lock` | python | uv | `uv sync` |
   | `poetry.lock` | python | poetry | `poetry install` |
   | `requirements*.txt` only | python | pip | `python -m pip install -r requirements.txt` (plus dev requirements file if present) |

   If two lock files for the same stack exist, record both and ask the user which one CI uses. Do not delete either.
4. Run the install command once. Record whether it succeeded.
5. Determine `test_command`. If the user gave one, use it. Otherwise: for TypeScript read `scripts.test` in `package.json` and use `npm test` (or the pnpm/yarn equivalent); for Python use `pytest -q` if `pytest` appears in the dev dependencies, else `python -m unittest discover`.
6. Run `test_command` once and record the pass and fail counts as `test_baseline`. Do not fix failing tests here; a failing test before the migration is a pre-existing fact, recorded so later flows do not blame type changes for it.
7. Detect CI: `.github/workflows/*.yml` means `github-actions`, `.gitlab-ci.yml` means `gitlab-ci`, `azure-pipelines.yml` means `azure-pipelines`, `.circleci/config.yml` means `circleci`, `Jenkinsfile` means `jenkins`. None found means `none`.

### Output
Package manager, install and test commands, test baseline, CI provider and branch recorded.

### Quality Gate
- `git status --porcelain` printed nothing before the branch was created.
- `test_baseline` contains numbers copied from the real test output, not estimates.
- `package_manager` matches a lock file that exists in the repo.

---

## Phase 2: Pin Versions and Choose the Checker

### Entry Criteria
- Phase 1 complete.

### Actions
1. TypeScript: run `npx tsc --version` and `node --version`. Read the `typescript` entry in `package.json` `devDependencies`. If it is missing, stop and ask the user to add it; never rely on a globally installed `tsc`. Record the exact installed version from `npm ls typescript` as `checker_version`.
2. TypeScript: locate the config. Run `npx tsc --showConfig -p <repo_path>/tsconfig.json` and save its output; this is the fully resolved config after every `extends`. If there is no `tsconfig.json`, record `config_file` as `none`; `tsm-ts-allowjs-checkjs` creates it.
3. Python: run `python --version`. Read `requires-python` from `pyproject.toml`. Record both.
4. Python: choose the checker with this table, in order. The first matching row wins:

   | Condition | checker |
   |---|---|
   | `python_checker` was given | that value |
   | `[tool.mypy]` in `pyproject.toml`, or `mypy.ini`, or `.mypy.ini`, or `[mypy]` in `setup.cfg` exists, and no pyright config | mypy |
   | `pyrightconfig.json` or `[tool.pyright]` exists, and no mypy config | pyright |
   | Both configs exist | **Return** to the user: ask which one CI enforces. Do not pick. |
   | Neither exists | **Return** to the user: ask for `python_checker`. |

5. Python: confirm the checker is a pinned dev dependency (`mypy==X.Y.Z` or `pyright==X.Y.Z` in the dev group or dev requirements). Run `mypy --version` or `pyright --version` and record `checker_version`. Checker upgrades add new errors; an unpinned checker makes the baseline meaningless.
6. Record `source_roots`: for TypeScript the `include` list from the resolved config (or `src` if that directory exists); for Python the package directories (a `src/<pkg>` layout or top-level packages with `__init__.py`).
7. Write `check_command`, exactly one of:
   - `npx tsc --noEmit -p tsconfig.json --pretty false`
   - `mypy` (when `files` is set in config) or `mypy <source_roots>`
   - `pyright --outputjson` (or `npx pyright --outputjson` when installed through npm)

### Output
`migration_profile` with versions, checker and `check_command`.

### Quality Gate
- `checker_version` was copied from command output, and the same version is pinned in the dependency file.
- `check_command` runs to completion (any exit code other than a crash or "command not found").
- Every field of `migration_profile` is filled or explicitly `none`.

---

## Worked Example

Illustrative only. Input: `repo_path=/work/billing`, `stack=python`, no `python_checker`, no `test_command`.

Phase 1: `git status --porcelain` prints nothing. `git switch -c types/strict-migration` succeeds. `uv.lock` exists, so `package_manager=uv`, `install_command=uv sync`. `pytest` is in `[dependency-groups] dev`, so `test_command=pytest -q`, which prints `412 passed, 3 skipped in 18.20s`; `test_baseline={passed: 412, failed: 0, skipped: 3}`. `.github/workflows/ci.yml` exists, so `ci_provider=github-actions`.

Phase 2: `python --version` prints `Python 3.12.4`. `pyproject.toml` has `[tool.mypy]` and no pyright section, so `checker=mypy`. `mypy --version` prints `mypy 1.11.2 (compiled: yes)` and the dev group pins `mypy==1.11.2`. Source root is `src/billing`. `check_command=mypy src/billing`.

---

## Exit Criteria

DONE when `migration_profile` is complete, the tree was clean at start, the migration branch exists, the checker version is pinned, and the test baseline is recorded from a real run.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Working tree is dirty | **Stop**: ask the user to commit or stash; never stash or discard their changes yourself. |
| Phase 1 | Install command fails | **Return**: report the exact error; a broken install makes every checker result unreliable. |
| Phase 1 | Tests fail before any change | **Adjust**: record the failures in `test_baseline` and continue; later flows compare against this list. |
| Phase 2 | `typescript` or the Python checker is not a pinned dev dependency | **Return**: ask the user to add it pinned; do not install globally. |
| Phase 2 | Both mypy and pyright configs exist | **Return**: ask which checker CI enforces. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
