# CI Stack Detection From Repository Files

**One-line description:** Identifies the language, package manager, lockfile, test runner and existing CI configuration of a repository from marker files only, so every later CI step uses the tools the project actually uses instead of guessed ones.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to a clean checkout of the repository (no uncommitted changes).
- `stack` (string, optional): The stack the user believes the project uses: one of `python`, `node`, `go`, `jvm`. Detection confirms it or reports the mismatch.

---

## Outputs

- `stack_profile` (object): `{stack, language_version_source, package_manager, lockfile, test_runner, monorepo_roots[], evidence[]}`. Every field cites the file that proves it.
- `existing_ci_files` (string[]): Every CI configuration file already present (paths relative to `repo_dir`). Empty when none.

---

## Phase 1: Inventory Marker Files

### Entry Criteria
- `repo_dir` exists and `git -C <repo_dir> status --porcelain` prints nothing.

### Actions
1. List tracked files only, so build output and `node_modules` never mislead detection: `git -C <repo_dir> ls-files > /tmp/files.txt`.
2. Search the list for marker files with one command: `grep -E '(^|/)(pyproject\.toml|setup\.py|setup\.cfg|requirements[^/]*\.txt|uv\.lock|poetry\.lock|Pipfile\.lock|package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|go\.mod|go\.sum|pom\.xml|build\.gradle(\.kts)?|settings\.gradle(\.kts)?|gradlew|mvnw)$' /tmp/files.txt`.
3. Search for existing CI configuration: `grep -E '^(\.github/workflows/.*\.ya?ml|\.gitlab-ci\.yml|\.circleci/config\.yml|azure-pipelines\.yml|Jenkinsfile|bitbucket-pipelines\.yml|\.buildkite/.*)$' /tmp/files.txt`. Record every hit in `existing_ci_files`.
4. Search for version pin files: `grep -E '(^|/)(\.python-version|\.nvmrc|\.node-version|\.tool-versions|\.java-version|\.sdkmanrc|rust-toolchain(\.toml)?)$' /tmp/files.txt`.
5. Do not read `README` prose to decide the stack. Only files from steps 2 to 4 count as evidence.

### Output
Raw marker list with paths, plus `existing_ci_files`.

### Quality Gate
- The three `grep` commands ran and their output is saved verbatim in `evidence[]`.
- `existing_ci_files` lists exactly the paths printed by step 3 (an empty list when step 3 printed nothing).

---

## Phase 2: Classify the Stack

### Entry Criteria
- Marker list exists.

### Actions
1. Classify with this table. Use the first matching row per directory root:

| Marker present | `stack` | `package_manager` | `lockfile` |
|---|---|---|---|
| `uv.lock` | python | uv | uv.lock |
| `poetry.lock` | python | poetry | poetry.lock |
| `Pipfile.lock` | python | pipenv | Pipfile.lock |
| `pyproject.toml` or `requirements*.txt` only | python | pip | requirements file, or "none" |
| `pnpm-lock.yaml` | node | pnpm | pnpm-lock.yaml |
| `yarn.lock` and `.yarnrc.yml` | node | yarn-berry | yarn.lock |
| `yarn.lock` without `.yarnrc.yml` | node | yarn-classic | yarn.lock |
| `bun.lock` or `bun.lockb` | node | bun | that file |
| `package-lock.json` | node | npm | package-lock.json |
| `go.mod` | go | go modules | go.sum |
| `pom.xml` (with or without `mvnw`) | jvm | maven | none (Maven has no lockfile by default) |
| `build.gradle` or `build.gradle.kts` | jvm | gradle | `gradle.lockfile` if tracked, else none |

2. If `package.json` contains a `"packageManager"` field (`grep -o '"packageManager": *"[^"]*"' package.json`), it overrides the lockfile row for the manager name and pins its version through Corepack.
3. If marker files sit in more than one directory, record each directory in `monorepo_roots[]` with its own row. Do not merge them.
4. If `stack` was given and differs from the detected stack, keep the detected value and add `"mismatch: user said <x>, files say <y>"` to `evidence[]`.

### Output
Classified stack, manager and lockfile per root.

### Quality Gate
- Every `stack_profile` field has an `evidence[]` entry naming the file that proves it.
- When two lockfiles for the same language exist in one root (for example `package-lock.json` and `yarn.lock`), the profile records a conflict instead of picking one.

---

## Phase 3: Identify Test Runner and Version Source

### Entry Criteria
- Stack classified.

### Actions
1. Find the test runner by exact text search, not by guessing:
   - Python: `grep -nE '^\[tool\.pytest|pytest' pyproject.toml setup.cfg tox.ini pytest.ini 2>/dev/null`; also check for `noxfile.py` or `tox.ini`.
   - Node: `node -e "console.log(JSON.stringify(require('./package.json').scripts,null,1))"` and look for `jest`, `vitest`, `mocha`, `playwright test`, `node --test` in the `test` script.
   - Go: the runner is `go test`; record whether `gotestsum` appears in a `Makefile` or `tools.go`.
   - JVM: Maven uses Surefire (unit) and Failsafe (`*IT` integration); Gradle uses the `test` task. Check `grep -n 'junit' pom.xml build.gradle*` for JUnit 4 versus JUnit 5 (`junit-jupiter`).
2. Find the language version source in this order and stop at the first hit: version pin file from Phase 1 step 4; `requires-python` in `pyproject.toml`; `engines.node` in `package.json`; the `go` directive in `go.mod` (and `toolchain` line if present); `maven.compiler.release` or `<release>` in `pom.xml`; `java { toolchain { languageVersion` in Gradle.
3. If no version source exists, set `language_version_source` to `"none"` and report it as an open question for the user. Do not pick a version yourself.

### Output
`stack_profile` and `existing_ci_files`.

### Quality Gate
- `test_runner` is quoted from a file line shown in `evidence[]`, or set to `"unknown"`.
- `language_version_source` is a file path plus line, or `"none"` with an open question raised.

---

## Worked Example

Illustrative only. Input: `repo_dir=/work/invoice-api`, `stack=python`.

Phase 1:
```
$ git -C /work/invoice-api ls-files | grep -E '(^|/)(pyproject\.toml|uv\.lock|package\.json)$'
pyproject.toml
uv.lock
web/package.json
$ git -C /work/invoice-api ls-files | grep -E '^(\.github/workflows/.*\.ya?ml|\.gitlab-ci\.yml)$'
.github/workflows/lint.yml
```
Phase 2: root `.` is python/uv/uv.lock; `web/` has `package.json` but no lockfile, recorded as a second root with lockfile "none" (open question: commit a lockfile).
Phase 3: `pyproject.toml:41: [tool.pytest.ini_options]` gives runner pytest; `.python-version` contains `3.12`.

Result: `stack_profile = {stack: "python", package_manager: "uv", lockfile: "uv.lock", test_runner: "pytest", language_version_source: ".python-version:1", monorepo_roots: [".", "web"]}`, `existing_ci_files = [".github/workflows/lint.yml"]`.

---

## Exit Criteria

DONE when `stack_profile` names the stack, manager, lockfile, test runner and version source for every root with file evidence, and `existing_ci_files` lists every CI file present.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Working tree is dirty | **Stop**: ask the user to commit or stash; untracked files distort detection. |
| Phase 1 | No marker file matches | **Return**: report "stack not detected" with the file list; do not guess. |
| Phase 2 | Two lockfiles for one language in one root | **Return**: report the conflict; CI must use one manager and the user picks which. |
| Phase 3 | `package.json` has no `test` script | **Adjust**: set `test_runner` to "none" and flag that CI cannot run tests until one is added. |
| Phase 3 | No language version source | **Return**: raise an open question; never invent a version. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
