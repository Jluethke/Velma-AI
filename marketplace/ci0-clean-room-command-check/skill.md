# Clean-Room Check of CI Commands in a Container

**One-line description:** Runs the stack's CI commands in a fresh container with a fresh clone, so commands that only pass because of the developer's machine (global tools, caches, untracked files, environment variables) are caught before they are written into any CI config.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository checkout.
- `py_ci_commands` (object, optional): From `ci0-py-ci-commands`.
- `node_ci_commands` (object, optional): From `ci0-node-ci-commands`.
- `go_ci_commands` (object, optional): From `ci0-go-ci-commands`.
- `jvm_ci_commands` (object, optional): From `ci0-jvm-ci-commands`.
- `runner_image` (string, optional): Container image that matches the CI runner, for example `python:3.12-bookworm`, `node:22-bookworm`, `golang:1.23-bookworm`, `eclipse-temurin:21-jdk`. Default: the official image for the stack and version in the commands' notes, chosen by the user.

---

## Outputs

- `verified_commands` (object): The single command set that passed in the clean container, in run order, with `{stage, command, exit_code, seconds}` per entry and the image digest used.
- `junit_report_globs` (string[]): Report path patterns that produced files inside the container.

---

## Phase 1: Prepare the Clean Room

### Entry Criteria
- Exactly one of `py_ci_commands`, `node_ci_commands`, `go_ci_commands`, `jvm_ci_commands` is present. If more than one is present (monorepo), run this flow once per command set.
- `docker version` exits 0.

### Actions
1. Make a fresh clone so untracked and ignored files are excluded: `git clone --no-local <repo_dir> /tmp/cleanroom && git -C /tmp/cleanroom checkout <same commit as repo_dir>`. Confirm with `git -C /tmp/cleanroom rev-parse HEAD`.
2. Pull the image and record its digest: `docker pull <runner_image>` then `docker image inspect --format '{{index .RepoDigests 0}}' <runner_image>`.
3. Write the command set to `/tmp/cleanroom-ci.sh` with `set -euo pipefail` as the second line, then the `setup`, `install`, `lint`, `typecheck`, `build`, `test` commands in that order, each preceded by `echo "::stage <name>"` and wrapped as `start=$(date +%s); <command>; echo "::exit $? $(( $(date +%s) - start ))"`.
4. Do not mount the host's `~/.cache`, `~/.m2`, `~/.npm`, `~/go` or any credential file. The point is a cold start.

### Output
Fresh clone, pinned image digest, run script.

### Quality Gate
- `git rev-parse HEAD` in the clone equals `git -C <repo_dir> rev-parse HEAD`.
- The image digest string begins with the image name followed by `@sha256:`.

---

## Phase 2: Run Cold and Classify Failures

### Entry Criteria
- Run script exists.

### Actions
1. Run: `docker run --rm -v /tmp/cleanroom:/src -v /tmp/cleanroom-ci.sh:/ci.sh:ro -w /src -e CI=true <image@digest> bash /ci.sh 2>&1 | tee /tmp/cleanroom.log`. `CI=true` matches what GitHub Actions and GitLab set, which changes some tools' behavior (Jest `--ci`, no interactive prompts).
2. Find the first failing stage: `grep -n '::stage\|::exit' /tmp/cleanroom.log`.
3. Classify the first failure with this table and apply only its response:

| Log evidence | Cause | Response |
|---|---|---|
| `command not found` for a tool | Tool was global on the dev machine | Add an install command to `setup[]` |
| Missing header or `.so` (for example `pg_config executable not found`, `libpq-fe.h`) | System package missing | Add `apt-get update && apt-get install -y <pkg>` to `setup[]` |
| File not found that exists on host | File is untracked or gitignored | Report it; the user must commit it or generate it in CI |
| Network error to a private registry | Missing credential | Record the secret name the CI job needs; do not paste credentials |
| Test failure only in container | Locale, timezone, or OS difference | Report test ID and log line; do not change the test |
| `Permission denied` running `./gradlew` or `./mvnw` | File mode 100644 in git | Report; see `ci0-jvm-ci-commands` |

4. After one fix, rerun the whole script from a fresh clone (Phase 1 step 1). Change one thing per rerun.

### Output
A passing cold run log, or a classified failure report.

### Quality Gate
- `/tmp/cleanroom.log` shows `::exit 0` for every stage.
- Every change made to the command set is listed with the log line that caused it.

---

## Phase 3: Emit the Verified Set

### Entry Criteria
- Every stage exited 0 in the container.

### Actions
1. Build `verified_commands` from the log: stage, command, exit code, seconds (from the `::exit` lines), plus the image digest.
2. Check report files inside the clone: for each `junit_path` from the input command set, run `ls /tmp/cleanroom/<pattern>` (use `find` for `**` patterns). Keep only patterns that matched files as `junit_report_globs`.
3. Delete `/tmp/cleanroom` and `/tmp/cleanroom-ci.sh` after copying the log.

### Output
`verified_commands`, `junit_report_globs`.

### Quality Gate
- Every entry in `verified_commands` has `exit_code` 0.
- Every entry in `junit_report_globs` matched at least one file in the container run.

---

## Worked Example

Illustrative only. Input `py_ci_commands` from a uv project, `runner_image=python:3.12-bookworm`.

Phase 1: digest `python@sha256:9c1e...`.
Phase 2 first run:
```
::stage install
  error: Failed to build `psycopg2==2.9.9`
  Error: pg_config executable not found.
::exit 1 14
```
Table row "missing header": add `apt-get update && apt-get install -y libpq-dev` to `setup[]`. Second run from a fresh clone: all stages `::exit 0`; test stage `::exit 0 52`.
Phase 3: `verified_commands` has 6 entries; `junit_report_globs = ["reports/junit.xml"]`.

---

## Exit Criteria

DONE when a cold container run of one command set passes every stage and every reported JUnit pattern produced files.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Docker not available | **Return**: report that the clean-room check could not run; never mark commands verified without it. |
| Phase 1 | No command set provided | **Stop**: run a `ci0-*-ci-commands` flow first. |
| Phase 2 | Same stage fails after three distinct fixes | **Return**: report all three logs; ask the user. |
| Phase 2 | Test passes on host, fails in container | **Return**: report as an environment-dependent test; do not edit the test. |
| Phase 3 | JUnit pattern matched nothing in container | **Adjust**: remove it from `junit_report_globs` and note the stage whose reporter flag is missing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
