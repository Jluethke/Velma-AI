# Run the Test Suite Inside the Image Build

**One-line description:** Adds a `test` stage that inherits the exact builder environment and runs the project's own test command during `docker build --target test`, forces it to rerun with `--no-cache-filter`, exports JUnit results with `--output`, and wires it so a plain build cannot skip it silently.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Build context with the Dockerfile.
- `image_name` (string, required): Local image name.
- `build_profile` (object, required): From `ctr-stack-inventory`; supplies `test_command` and stack.

---

## Outputs

- `image_test_report` (object): The `test` stage text, the commands used, pass/fail counts copied from the test runner output, the path of exported test reports, and whether the final image depends on the test stage.

---

## Phase 1: Write the Test Stage

### Entry Criteria
- `build_profile.test_command` is known.
- The Dockerfile has a builder stage that contains the source and full (dev) dependencies, or one can be added.

### Actions
1. The test stage must start from a stage that has dev dependencies. Use this table:

| stack | `FROM` for test stage | Extra install | Test command shape |
|---|---|---|---|
| python (uv) | `build` | `uv sync --frozen` (with dev group) | `uv run --frozen pytest -q --junitxml=/reports/junit.xml` |
| python (pip) | `build` | `pip install -r requirements-dev.txt` (the file the repo uses) | `pytest -q --junitxml=/reports/junit.xml` |
| node | `deps` (full `npm ci`), then `COPY . .` | none | the repo's `npm test`; add a JUnit reporter only if the repo already configures one |
| go | `build` | none | `go test ./... 2>&1 \| tee /reports/go-test.txt` (or `gotestsum --junitfile` if the repo already uses gotestsum) |
| java (Maven) | `build` | none | `./mvnw -B -ntp test` (reports in `target/surefire-reports`) |
| java (Gradle) | `build` | none | `./gradlew --no-daemon test` (reports in `build/test-results/test`) |

2. Write the stage, then an export stage for reports:
```
FROM build AS test
RUN mkdir -p /reports
RUN --mount=type=cache,target=/root/.cache/uv uv sync --frozen
RUN uv run --frozen pytest -q --junitxml=/reports/junit.xml

FROM scratch AS test-reports
COPY --from=test /reports /
```
   For Java, copy the surefire or Gradle results directory into `/reports` in the test stage.
3. Tests that need services (databases) cannot run in `docker build` because build steps have no access to Compose services. Mark such tests by the repo's existing marker (`-m "not integration"`, Go build tags, Maven profiles) and record that they run in `ctr-compose-local-dev` instead. Do NOT delete, skip or weaken any test to get the stage green.
4. Do NOT change the test command's flags beyond adding a report path. If the test command in CI uses `-x` or `--maxfail`, keep it as CI has it.

### Output
`test` and `test-reports` stages.

### Quality Gate
- `grep -n "AS test" Dockerfile` shows the stage.
- The test command in the stage equals `build_profile.test_command` except for the added report flag.

---

## Phase 2: Run and Read Results

### Entry Criteria
- Stages written.

### Actions
1. Run tests, forcing the test step to execute even when cached:
```
docker build --progress=plain --no-cache-filter test --target test -t <image_name>:test <project_dir> 2>&1 | tee /tmp/test-build.log
```
2. Export reports to the host:
```
docker build --target test-reports --output type=local,dest=./test-reports <project_dir>
```
   Add `test-reports/` to `.gitignore` if it is not already ignored; never commit it.
3. Read the runner summary from the log, not from the exit code alone: pytest prints `N passed, M failed`; Jest prints `Tests: N passed, N total`; `go test` prints `ok` or `FAIL` per package; Maven prints `Tests run: N, Failures: F, Errors: E, Skipped: S`.
4. A failing test makes the `RUN` exit non-zero and the build fails with `ERROR: failed to solve: process "/bin/sh -c ..." did not complete successfully: exit code: 1`. That is the intended behavior.
5. Compare the count with a local or CI run of the same command. A large drop in test count means files are missing from the context (check `.dockerignore` for `tests/`).

### Output
Pass/fail counts and report files.

### Quality Gate
- `/tmp/test-build.log` contains the runner summary line; the counts in the report are copied from it.
- `ls test-reports/` shows the report file.

---

## Phase 3: Make the Default Build Depend on Tests

### Entry Criteria
- Tests pass in the image.

### Actions
1. BuildKit builds only the stages the target needs. A plain `docker build` targeting `runtime` skips `test`. Decide with the user:

| Choice | How |
|---|---|
| Every build runs tests | In the test stage end with `RUN touch /tests-passed`; in `runtime` add `COPY --from=test /tests-passed /tmp/tests-passed`. The runtime image now depends on the test stage. |
| CI runs tests as a separate step | Leave stages independent; add `docker build --target test ...` to the CI workflow before the image build and record the file and line. |

2. If using the first choice, confirm with `docker build --progress=plain -t <image_name>:dev <project_dir>` that the log shows the `[test ...]` steps.

### Output
`image_test_report`.

### Quality Gate
- The default build log shows `[test` steps, or the CI workflow file contains a `--target test` build line (cite it).

---

## Worked Example

Illustrative. Python uv project, `test_command = uv run pytest -q`.

Phase 1: `FROM build AS test`, `uv sync --frozen`, `uv run --frozen pytest -q --junitxml=/reports/junit.xml`; `test-reports` stage copies `/reports`.

Phase 2: log shows `#14 12.31 ===== 214 passed, 3 deselected in 9.87s =====` (3 deselected by `-m "not integration"` from `pyproject.toml` addopts). `test-reports/junit.xml` exported. CI also reports 214 passed.

Phase 3: user picks CI step; `.github/workflows/ci.yml` line 52 runs `docker build --target test .`.

---

## Exit Criteria

DONE when the suite runs inside the builder environment, counts match a normal run, reports are exported, and either the default build or CI runs the test stage on every change.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tests import from paths excluded by `.dockerignore` | **Adjust**: re-include test directories in `.dockerignore`, rerun. |
| Phase 2 | Tests fail only in the image | **Return**: report the failing tests and error lines; common causes are missing system libraries, time zone, or locale. Do not skip the tests. |
| Phase 2 | Tests need network or a database | **Adjust**: run them under the repo's integration marker in Compose instead, and record which tests moved. |
| Phase 3 | Test stage step shows `CACHED` and never reruns | **Retry**: use `--no-cache-filter test`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
