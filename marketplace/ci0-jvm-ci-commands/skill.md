# JVM CI Commands for Maven and Gradle

**One-line description:** Writes the exact batch-mode Maven or Gradle wrapper commands for CI (wrapper validation, dependency resolution, compile, unit and integration tests) and locates the Surefire, Failsafe or Gradle JUnit XML reports.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository checkout.
- `stack_profile` (object, required): From `ci0-detect-stack`; `stack` must be `jvm`.

---

## Outputs

- `jvm_ci_commands` (object): `{setup[], install[], build[], test[], junit_path, notes[]}`.

---

## Phase 1: Wrapper and JDK

### Entry Criteria
- `pom.xml` or `build.gradle(.kts)` exists.

### Actions
1. Use the wrapper when it is committed: `./mvnw` if `mvnw` and `.mvn/wrapper/maven-wrapper.properties` are tracked; `./gradlew` if `gradlew` and `gradle/wrapper/gradle-wrapper.properties` are tracked. Otherwise use `mvn` or `gradle` and record "no wrapper: build tool version not pinned" in `notes[]`.
2. Check the wrapper is executable in git: `git ls-files -s mvnw gradlew`. Mode `100755` is correct; `100644` causes `Permission denied` in CI. Report it; fix only with `git update-index --chmod=+x gradlew` if the user approves.
3. Gradle only: the wrapper JAR must be validated in CI. In GitHub Actions use `gradle/actions/wrapper-validation`; elsewhere compare `sha256sum gradle/wrapper/gradle-wrapper.jar` against the checksum Gradle publishes for that version.
4. JDK version: take it from `stack_profile.language_version_source`. In GitHub Actions `actions/setup-java` requires both `java-version` and `distribution` (for example `temurin`); record the distribution as an open question if the repo does not state it.

### Output
`setup[]`.

### Quality Gate
- `git ls-files -s` output for the wrapper script is recorded and shows mode `100755`, or the problem is reported.
- JDK version cites a file line, or is an open question.

---

## Phase 2: Build and Test Commands

### Entry Criteria
- Wrapper and JDK decided.

### Actions
1. Use these exact command forms:

| Tool | Resolve dependencies | Full CI build with tests |
|---|---|---|
| Maven | `./mvnw -B -ntp dependency:go-offline` (optional; some plugins still resolve later) | `./mvnw -B -ntp verify` |
| Gradle | not needed separately | `./gradlew build --stacktrace` (runs `check`, which includes `test`) |

2. Flag meanings: `-B` is batch mode (no interactive prompts, no color codes); `-ntp` is `--no-transfer-progress` (removes download log noise). Confirm with `./mvnw --help | grep -E 'batch-mode|no-transfer-progress'`.
3. Maven phase choice: use `verify`, not `test`, so Failsafe integration tests (`*IT.java`) also run, and not `install`, which writes to the local repository and is not needed for CI checks unless a multi-module build requires it (`-pl`/`-am` users: record the module list).
4. Do not add `-DskipTests`, `-Dmaven.test.failure.ignore=true`, `-x test` or `--continue` to reach green.
5. For Gradle, do not pass `--no-daemon` and `--offline` together unless dependencies are already cached; `--offline` fails on a cold runner.

### Output
`install[]`, `build[]`, `test[]`.

### Quality Gate
- The command list contains none of: `-DskipTests`, `-Dmaven.test.skip`, `test.failure.ignore`, `-x test`.
- The flag check from step 2 printed both option names.

---

## Phase 3: Run Once and Locate Reports

### Entry Criteria
- Commands written.

### Actions
1. Run the full build command and record the exit code and the last summary lines (`BUILD SUCCESS`/`BUILD FAILURE` for Maven, `BUILD SUCCESSFUL`/`BUILD FAILED` for Gradle).
2. Locate JUnit XML files:

| Tool | Report path pattern |
|---|---|
| Maven Surefire (unit) | `**/target/surefire-reports/TEST-*.xml` |
| Maven Failsafe (integration) | `**/target/failsafe-reports/TEST-*.xml` |
| Gradle | `**/build/test-results/**/TEST-*.xml` |

3. Confirm files exist: `find . -path '*/target/surefire-reports/TEST-*.xml' | wc -l` (or the Gradle path).
4. Set `junit_path` to the pattern from the table that produced files. Multi-module projects need the `**/` prefix.

### Output
`jvm_ci_commands`.

### Quality Gate
- The `find ... | wc -l` command prints a number greater than 0.
- The build summary line is quoted in `notes[]`.

---

## Worked Example

Illustrative only. Maven multi-module project with `mvnw`, JDK 21 from `<maven.compiler.release>21</maven.compiler.release>`.

Phase 1: `git ls-files -s mvnw` prints `100755 3f2a... 0	mvnw`. Distribution not stated: open question, default proposal `temurin` pending user approval.
Phase 2: commands `./mvnw -B -ntp verify`.
Phase 3:
```
$ ./mvnw -B -ntp verify
[INFO] Tests run: 506, Failures: 0, Errors: 0, Skipped: 4
[INFO] BUILD SUCCESS
$ find . -path '*/target/surefire-reports/TEST-*.xml' | wc -l
61
```
`junit_path = "**/target/surefire-reports/TEST-*.xml"`; Failsafe found 0 files, noted "no integration tests".

---

## Exit Criteria

DONE when the full build ran once with exit code recorded, no test-skipping flag is present, and the JUnit report pattern matches at least one file.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Wrapper not executable | **Return**: report mode 100644 and the `git update-index --chmod=+x` fix for the user to approve. |
| Phase 1 | Gradle wrapper JAR checksum mismatch | **Stop**: possible tampering; report and do not run the wrapper. |
| Phase 2 | Private repository (Nexus, Artifactory) needed | **Adjust**: record a `settings.xml` or `gradle.properties` credential from CI secrets; never commit credentials. |
| Phase 3 | Build fails on tests | **Return**: report failing test classes from the reports; never add skip flags. |
| Phase 3 | No report files | **Adjust**: check for a custom `reportsDirectory` in `pom.xml` or `reports.junitXml.outputLocation` in Gradle and use that path. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
