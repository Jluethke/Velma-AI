# Dependency Upgrade Scope Intake

**One-line description:** Detects the repository's ecosystems, package managers, lockfiles and test commands from the files actually present, fixes the upgrade goal to one allowed value, and creates the shared work directory every later dup- flow reads and writes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root (the directory that contains `.git`).
- `stack` (string, required): One of `python`, `node`, `go`, `rust`, `jvm`. The primary ecosystem to upgrade in this run.
- `upgrade_goal` (string, required): One of `security-only`, `minor-patch`, `framework-major`, `node-lts`, `all`.
- `framework` (string, optional): One of `django`, `react`, `spring-boot`, `none`. Default `none`.
- `bot` (string, optional): One of `renovate`, `dependabot`, `none`. Default `none`.
- `target_packages` (string[], optional): Package names to restrict the run to. Empty means every direct dependency.
- `test_command` (string, optional): The command that runs the full test suite. When absent, it is detected in Phase 2.

---

## Outputs

- `upgrade_scope` (object): `repo_path`, `stack`, `upgrade_goal`, `framework`, `bot`, `target_packages`, `package_manager`, `manifest_files`, `lockfile`, `install_command`, `test_command`, `build_command`, `runtime_version`, `work_dir`, `branch`. Also written to `<work_dir>/scope.json`.

---

## Phase 1: Detect Ecosystem And Package Manager

### Entry Criteria
- `repo_path` exists and `git -C <repo_path> rev-parse --show-toplevel` prints that same path.
- `stack` and `upgrade_goal` are each one of their allowed values. Any other value: stop and ask.

### Actions
1. List manifest and lockfile names at the root and one level down: `git -C <repo_path> ls-files | grep -E '(^|/)(pyproject.toml|requirements[^/]*\.(txt|in)|setup.cfg|setup.py|Pipfile|poetry.lock|uv.lock|Pipfile.lock|package.json|package-lock.json|npm-shrinkwrap.json|pnpm-lock.yaml|yarn.lock|go.mod|go.sum|Cargo.toml|Cargo.lock|pom.xml|build.gradle(.kts)?|settings.gradle(.kts)?|gradle/libs.versions.toml|gradle.lockfile)$'`.
2. Pick the package manager from this table. Use the FIRST row that matches the files found. Do not guess from habit.

| Stack | File present | package_manager | install_command (reproducible) |
|---|---|---|---|
| python | `uv.lock` | uv | `uv sync --locked` |
| python | `poetry.lock` | poetry | `poetry install --sync` (Poetry 1.x) or `poetry sync` (Poetry 2.x; check `poetry --version`) |
| python | `Pipfile.lock` | pipenv | `pipenv sync --dev` |
| python | `requirements*.in` plus `requirements*.txt` | pip-tools | `pip-sync requirements.txt` (add dev files if present) |
| python | only `requirements*.txt` | pip | `python -m pip install -r requirements.txt` |
| node | `pnpm-lock.yaml` | pnpm | `pnpm install --frozen-lockfile` |
| node | `yarn.lock` and `.yarnrc.yml` | yarn-berry | `yarn install --immutable` |
| node | `yarn.lock` only | yarn-classic | `yarn install --frozen-lockfile` |
| node | `package-lock.json` or `npm-shrinkwrap.json` | npm | `npm ci` |
| go | `go.mod` | go | `go mod download && go mod verify` |
| rust | `Cargo.toml` | cargo | `cargo fetch --locked` |
| jvm | `pom.xml` | maven | `./mvnw -B -q dependency:go-offline` (use `mvn` if no wrapper) |
| jvm | `build.gradle` or `build.gradle.kts` | gradle | `./gradlew --no-daemon dependencies` |

3. If two lockfiles of the same ecosystem exist (for example `package-lock.json` and `yarn.lock`), record both in `manifest_files` and record `package_manager` as `CONFLICT`. Do not delete either file here; `dup-*-lockfile-hygiene` resolves it.
4. Record `runtime_version` with the matching command: `python --version`, `node --version`, `go version`, `rustc --version`, `java -version 2>&1 | head -1`.

### Output
`package_manager`, `manifest_files`, `lockfile`, `install_command`, `runtime_version`.

### Quality Gate
- `manifest_files` lists at least one file that `git ls-files` printed.
- `package_manager` is a value from the table or `CONFLICT`, never free text.

---

## Phase 2: Detect Test And Build Commands

### Entry Criteria
- Phase 1 output exists.

### Actions
1. If `test_command` was given, use it unchanged. Otherwise read the first source that exists, in this order:
   - CI config: `.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, `azure-pipelines.yml`. Copy the exact test step command.
   - `Makefile` target named `test`: use `make test`.
   - node: `npm pkg get scripts.test`; use `npm test` when it prints a real command (not the npm default `echo "Error: no test specified" && exit 1`).
   - python: `pytest` if `pytest` appears in `pyproject.toml`, `setup.cfg`, `pytest.ini` or `tox.ini`; `python manage.py test` if `manage.py` exists and pytest does not.
   - go: `go test ./...`. rust: `cargo test --locked`. maven: `./mvnw -B verify`. gradle: `./gradlew --no-daemon check`.
2. Pick `build_command` the same way (CI build step first): node `npm run build` only if `npm pkg get scripts.build` is non-empty; go `go build ./...`; rust `cargo build --locked --all-targets`; maven `./mvnw -B -DskipTests package`; gradle `./gradlew --no-daemon assemble`; python: `python -m compileall -q .` when no build step exists.
3. If no test command can be found, set `test_command` to `NONE` and add an open question to the scope. Do not invent a test command that does not run.

### Output
`test_command`, `build_command`.

### Quality Gate
- `test_command` was copied from a file you can cite (path and line) or from the user, or is `NONE`.
- Running `<test_command> --help` or the command itself starts without "command not found".

---

## Phase 3: Create Work Directory And Branch

### Entry Criteria
- `git -C <repo_path> status --porcelain` prints nothing. If it prints anything, stop: the user must commit or stash first.

### Actions
1. Set `work_dir` to `<repo_path>/.dep-upgrade`. Create it: `mkdir -p <repo_path>/.dep-upgrade`.
2. Keep it out of commits without touching tracked files: append the line `.dep-upgrade/` to `<repo_path>/.git/info/exclude`. Do not edit `.gitignore`.
3. Create the branch: `git -C <repo_path> switch -c deps/<upgrade_goal>-<YYYYMMDD>`. Record it as `branch`.
4. Write `<work_dir>/scope.json` with every field of `upgrade_scope`.

### Output
`upgrade_scope` and `<work_dir>/scope.json`.

### Quality Gate
- `git -C <repo_path> check-ignore .dep-upgrade/scope.json` prints the path.
- `git -C <repo_path> branch --show-current` prints `branch`.

---

## Worked Example

Illustrative only. Input: `repo_path=/srv/shop`, `stack=python`, `upgrade_goal=framework-major`, `framework=django`, `bot=none`.

- Phase 1: `git ls-files` prints `pyproject.toml`, `uv.lock`, `manage.py`. Row 1 matches: `package_manager=uv`, `install_command="uv sync --locked"`. `python --version` prints `Python 3.11.9`.
- Phase 2: `.github/workflows/ci.yml` line 41 runs `uv run pytest -q`. `test_command="uv run pytest -q"`, `build_command="python -m compileall -q ."`.
- Phase 3: branch `deps/framework-major-20261020` created; `.dep-upgrade/scope.json` written; `git check-ignore .dep-upgrade/scope.json` prints `.dep-upgrade/scope.json`.

---

## Exit Criteria

DONE when `<work_dir>/scope.json` exists, the work directory is ignored by git, the upgrade branch is checked out, and every field of `upgrade_scope` is filled or marked as an open question.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stack` has no matching manifest in the repo | **Stop**: report the files found; ask the user to confirm the stack. |
| Phase 1 | Two lockfiles for one ecosystem | **Adjust**: record `CONFLICT`; the lockfile hygiene flow picks one with the user. |
| Phase 2 | No test command anywhere | **Return**: set `test_command=NONE` and list it as an open question; later flows cannot prove safety without it. |
| Phase 3 | Working tree is dirty | **Stop**: ask the user to commit or stash. Never stash or discard their changes yourself. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
