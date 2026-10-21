# Repo Orientation: Stack, Entry Points and Documented Commands

**One-line description:** Identifies a repository's ecosystem from its marker files, finds its entry points, and records the exact build, test, lint and format commands the project itself documents (CI config, Makefile, package scripts, CONTRIBUTING), so later steps run the project's commands instead of guessed ones.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to a clean clone of the repository.
- `stack` (string, required): The stack the ticket's change lives in: `python`, `node`, `go` or `rust`. In a monorepo, the stack of the package the ticket touches. Chains use it to select stack-specific steps; Phase 1 confirms it against marker files.

---

## Outputs

- `repo_profile` (object): `stack` (python, node, go, rust, or a list for monorepos), `default_branch`, `package_manager`, `entry_points` (file plus line), `commands` (build, test, test_single, lint, format_check, typecheck; each with the source file and line it was read from), `ci_files`, `codeowners_path`, `pr_template_path`, `commit_convention` (detected or `none`).

---

## Phase 1: Detect the Stack

### Entry Criteria
- `repo_path` exists and `git -C <repo_path> status --porcelain` prints nothing (clean tree). If it prints anything, stop.

### Actions
1. List marker files at the root and one level down: `git -C <repo_path> ls-files | grep -E '(^|/)(pyproject.toml|setup.py|setup.cfg|requirements[^/]*\.txt|Pipfile|package.json|go.mod|go.work|Cargo.toml|pnpm-workspace.yaml|tsconfig.json)$'`.
2. Map markers to stack with this table. Record every match; a monorepo has several.

| Marker file | stack | Package manager detection |
|---|---|---|
| `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements*.txt` | python | `uv.lock` = uv; `poetry.lock` = poetry; `pdm.lock` = pdm; `Pipfile.lock` = pipenv; else pip |
| `package.json` | node | `pnpm-lock.yaml` = pnpm; `yarn.lock` = yarn; `bun.lockb` or `bun.lock` = bun; `package-lock.json` = npm. Also read the `packageManager` field in `package.json`. |
| `go.mod` | go | go modules (`go.work` = multi-module workspace) |
| `Cargo.toml` | rust | cargo (`[workspace]` table = workspace) |

3. Find the default branch: `git -C <repo_path> symbolic-ref refs/remotes/origin/HEAD` and strip `refs/remotes/origin/`. If that fails, run `git -C <repo_path> remote show origin` and read the `HEAD branch:` line. Do NOT assume `main`.

4. Compare the user-supplied `stack` with the detected list. If the detected list does not contain it, stop: the chain would run the wrong stack's baseline and lint steps.

### Output
`stack`, `package_manager`, `default_branch`.

### Quality Gate
- Each detected stack is backed by a marker file path printed by Action 1.
- The user-supplied `stack` is in the detected list.
- `default_branch` was read from command output, not assumed.

---

## Phase 2: Read Documented Commands

### Entry Criteria
- Stack known.

### Actions
1. Read these files in this priority order and stop collecting a command once a higher source gave it: (1) CI config: `.github/workflows/*.yml`, `.gitlab-ci.yml`, `.circleci/config.yml`, `azure-pipelines.yml`, `Jenkinsfile`; (2) `Makefile`, `justfile`, `Taskfile.yml`, `noxfile.py`, `tox.ini`; (3) `package.json` `scripts`; (4) `CONTRIBUTING.md`, `README.md`, `docs/development*`.
2. CI config wins because it is what gates the merge. In GitHub Actions, the commands are the `run:` keys of each job's `steps`. Note any `working-directory:` key; the command only works from that directory.
3. Record each command with its source file and line: build, test (full suite), test_single (how to run one test), lint, format_check, typecheck. If a command is not documented anywhere, write `undocumented` for it. Do not fill it in from memory here; the stack-specific baseline flow handles defaults.
4. Read config files that change tool behavior and note their presence: `ruff.toml`, `[tool.ruff]`, `[tool.mypy]`, `mypy.ini`, `setup.cfg [mypy]`, `pytest.ini`, `[tool.pytest.ini_options]`, `.eslintrc*`, `eslint.config.*`, `.prettierrc*`, `tsconfig*.json`, `.golangci.yml`/`.golangci.yaml`/`.golangci.toml`, `clippy.toml`, `rustfmt.toml`, `rust-toolchain.toml`.
5. Detect commit convention: presence of `commitlint.config.*`, `.commitlintrc*`, a `commit-msg` hook in `.husky/`, or `.pre-commit-config.yaml` with a `conventional-pre-commit` or `commitizen` hook means Conventional Commits is enforced. Otherwise run `git -C <repo_path> log -20 --format=%s` and check whether the subjects follow `type(scope): subject`.
6. Record `CODEOWNERS` location (`.github/CODEOWNERS`, `CODEOWNERS`, or `docs/CODEOWNERS`) and PR template (`.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE.md`, or `.github/PULL_REQUEST_TEMPLATE/`).

### Output
`commands`, `ci_files`, `commit_convention`, `codeowners_path`, `pr_template_path`.

### Quality Gate
- Every command in `commands` cites a file and line, or is `undocumented`.
- `commit_convention` cites the config file or the 20-subject log sample it was based on.

---

## Phase 3: Find Entry Points

### Entry Criteria
- Commands recorded.

### Actions
1. Use this table to locate entry points:

| stack | Where to look |
|---|---|
| python | `[project.scripts]` in `pyproject.toml`; `entry_points` in `setup.cfg`/`setup.py`; `__main__.py`; `if __name__ == "__main__":` (`rg -n '__name__ == .__main__.'`); framework apps: `rg -n 'FastAPI\(|Flask\(|Django|get_wsgi_application|get_asgi_application'` |
| node | `main`, `module`, `exports`, `bin` in `package.json`; `scripts.start`; framework roots: `app/` or `pages/` (Next.js), `src/main.ts` (NestJS), `rg -n 'express\(\)|createServer\(|listen\('` |
| go | `rg -n --type go '^func main\(\)'`; every `cmd/<name>/main.go` |
| rust | `src/main.rs`, `src/bin/*.rs`, `[[bin]]` tables in `Cargo.toml`, `src/lib.rs` for libraries |

2. For each entry point, record the file and line number.
3. Write the `repo_profile` object.

### Output
`repo_profile`.

### Quality Gate
- At least one entry point is listed with file and line, or the repo is marked library-only with the file that proves it (`src/lib.rs`, `exports` field, or no `main`).
- `repo_profile` contains every key listed in Outputs.

---

## Worked Example

Illustrative only. `repo_path` = `/work/billing`.

Phase 1:
```
$ git ls-files | grep -E '(^|/)(pyproject.toml|package.json|go.mod|Cargo.toml|uv.lock)$'
pyproject.toml
uv.lock
web/package.json
$ git symbolic-ref refs/remotes/origin/HEAD
refs/remotes/origin/develop
```
stack = [python, node], python package manager = uv, `web/` uses pnpm (`web/pnpm-lock.yaml`), default_branch = develop.

Phase 2 (from `.github/workflows/ci.yml`):
```
line 31  run: uv run ruff check .
line 32  run: uv run ruff format --check .
line 33  run: uv run mypy src
line 34  run: uv run pytest -q
line 52  working-directory: web ; run: pnpm run lint && pnpm exec tsc --noEmit
```
commit_convention = conventional (`.pre-commit-config.yaml` has `conventional-pre-commit`).

Phase 3: entry points `src/billing/__main__.py:1`, `src/billing/api.py:14 app = FastAPI()`.

---

## Exit Criteria

DONE when `repo_profile` lists the stack with marker evidence, the default branch from git output, every command with its source line or `undocumented`, and at least one entry point or proof the repo is a library.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Working tree not clean | **Stop**: ask the user to commit or stash; never run `git stash` or `git checkout .` on their behalf. |
| Phase 1 | No marker file found | **Return**: report the stack as unknown with the `ls-files` output; do not guess. |
| Phase 1 | User-supplied `stack` not among detected stacks | **Stop**: show the marker files found and ask the user which package the ticket touches. |
| Phase 1 | No `origin` remote | **Adjust**: ask the user for the default branch name and record it as user-supplied. |
| Phase 2 | CI and README disagree | **Adjust**: use the CI command; note the README line as stale in the profile. |
| Phase 3 | Many entry points (monorepo) | **Adjust**: list them all; later steps scope to the package the ticket touches. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
