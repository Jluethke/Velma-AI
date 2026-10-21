# Find the Java Verify Commands the Repo Already Uses (Maven or Gradle)

**One-line description:** Detects Maven or Gradle and the wrapper script, the module that owns the goal file, and the CI build line, then writes exact compile, single-test (`-Dtest=Class#method` or `--tests`), touched-file check and full-suite commands with the report file locations a small model must read.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `goal_check` (object, required): From `stp-goal-to-runnable-check`.

---

## Outputs

- `java_verify_commands` (object): `{ "build_tool": str, "wrapper": str, "module": str, "compile_one": str, "test_one": str, "check_touched": [str], "full_suite": str, "collect_count": str, "report_paths": [str], "sources": [str] }`.

---

## Phase 1: Detect the Build Tool and Wrapper

### Entry Criteria
- `repo_path` contains `pom.xml`, `build.gradle` or `build.gradle.kts`.

### Actions
1. Pick the tool:

| Files at root | `build_tool` | `wrapper` (Unix) | `wrapper` (Windows) |
|---|---|---|---|
| `pom.xml` and `mvnw` | Maven | `./mvnw` | `mvnw.cmd` |
| `pom.xml` only | Maven | `mvn` | `mvn` |
| `build.gradle(.kts)` and `gradlew` | Gradle | `./gradlew` | `gradlew.bat` |
| `build.gradle(.kts)` only | Gradle | `gradle` | `gradle` |

2. Always prefer the wrapper: it downloads the build tool version the project pins (`.mvn/wrapper/maven-wrapper.properties`, `gradle/wrapper/gradle-wrapper.properties`).
3. Run `java -version` (writes to stderr) and record the version. Read the target release: Maven `maven.compiler.release` or `maven.compiler.source` in `pom.xml`, or `<release>` in the `maven-compiler-plugin` config; Gradle `java { toolchain { languageVersion = ... } }` or `sourceCompatibility`.
4. Multi-module: Maven `<modules>` in the root `pom.xml`; Gradle `include(...)` in `settings.gradle(.kts)`. The module containing the goal file is `module` (for example `core` or `:core`).

### Output
`build_tool`, `wrapper`, `module`, JDK and target release.

### Quality Gate
- `<wrapper> --version` exits 0.
- `java -version` major version is at least the target release.

---

## Phase 2: Read What CI Runs

### Entry Criteria
- Build tool known.

### Actions
1. Run `rg -n "mvnw?|gradlew?" .github Jenkinsfile .gitlab-ci.yml 2>/dev/null` and copy each command with `file:line` into `sources`.
2. Record CI goals or tasks (`verify`, `check`, `build`) and flags (`-B` batch mode, `-P <profile>`, `--no-daemon`). Maven `verify` runs integration tests (Failsafe) after unit tests (Surefire); Gradle `check` runs `test` plus configured checks (Checkstyle, SpotBugs, Spotless check tasks if applied).
3. Note static checks bound in the build: `maven-checkstyle-plugin`, `spotless-maven-plugin`, `com.diffplug.spotless`, `checkstyle` plugin. These become `check_touched` commands.

### Output
`sources` and check plugins.

### Quality Gate
- Each check in `check_touched` is a plugin or task present in `pom.xml` or the Gradle build file.

---

## Phase 3: Write the Four-Speed Command Set

### Entry Criteria
- Phase 2 complete.

### Actions
1. `compile_one`:
   - Maven: `<wrapper> -q -pl <module> -am test-compile` (compiles main and test sources of the module and the modules it depends on).
   - Gradle: `<wrapper> :<module>:compileTestJava` (`compileTestKotlin` for Kotlin).
2. `test_one`:
   - Maven: `<wrapper> -pl <module> -am test -Dtest='SlugTest#stripsAccents' -Dsurefire.failIfNoSpecifiedTests=false` is the multi-module form; the property stops modules that do not contain the class from failing. In a single-module project drop `-pl`, `-am` and that property: there, "No tests matching pattern" must stay a failure.
   - Gradle: `<wrapper> :<module>:test --tests 'com.acme.slug.SlugTest.stripsAccents'`. Gradle fails with "No tests found for given includes" when the filter matches nothing; that is a selector miss.
   - Gradle up-to-date trap: if nothing changed, the `test` task prints `UP-TO-DATE` and runs nothing. Add `--rerun-tasks` only to `test_one` when you need a forced re-run, or `--rerun` (task-level, Gradle 7.6 and later; check `<wrapper> help --task test`).
3. `check_touched`: the CI static-check goal scoped to the module, such as `<wrapper> -pl <module> spotless:check`, `<wrapper> -pl <module> checkstyle:check`, `<wrapper> :<module>:spotlessCheck`, `<wrapper> :<module>:checkstyleMain`.
4. `full_suite`: CI's line (for example `./mvnw -B verify`, `./gradlew check`).
5. `report_paths`: Maven `<module>/target/surefire-reports/*.txt` and `TEST-*.xml`; Gradle `<module>/build/test-results/test/TEST-*.xml` and `<module>/build/reports/tests/test/index.html`.
6. `collect_count`: after `full_suite`, sum the `tests=` attributes in the XML reports: `rg -o 'tests="[0-9]+"' <module>/target/surefire-reports/TEST-*.xml` (Gradle path for Gradle).

### Output
`java_verify_commands`.

### Quality Gate
- `test_one` names one class and one method.
- `report_paths` directories exist after one `test_one` run.

---

## Worked Example

Illustrative only.

Repo `/work/slugj`: `pom.xml` with modules `core`, `web`; `mvnw` present; `maven.compiler.release` 17; CI line `run: ./mvnw -B verify`.

- Phase 1: Maven, `./mvnw`, `module` = `core`, `openjdk version "17.0.11"`.
- Phase 2: `sources` = [`.github/workflows/build.yml:27 ./mvnw -B verify`]; `spotless-maven-plugin` declared.
- Phase 3:
```
compile_one:   ./mvnw -q -pl core -am test-compile
test_one:      ./mvnw -pl core -am test -Dtest='SlugTest#stripsAccents' -Dsurefire.failIfNoSpecifiedTests=false
check_touched: ./mvnw -pl core spotless:check
full_suite:    ./mvnw -B verify
report_paths:  core/target/surefire-reports/
$ ./mvnw -pl core -am test -Dtest='SlugTest#stripsAccents' -Dsurefire.failIfNoSpecifiedTests=false
[INFO] Tests run: 0, Failures: 0, Errors: 0, Skipped: 0
```
`Tests run: 0` is a selector miss here: the method does not exist yet.

---

## Exit Criteria

DONE when `java_verify_commands` has wrapper-based compile and single-test commands for the owning module, CI's full command, and report paths.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `JAVA_HOME is not set` or wrong JDK major | **Stop**: report the required JDK; do not change the release in the build file. |
| Phase 1 | Wrapper not executable on Unix | **Adjust**: run `sh ./mvnw` or `sh ./gradlew`; do not `chmod` tracked files. |
| Phase 2 | Build needs a private repository (401 on dependency download) | **Stop**: credentials are a stop trigger. |
| Phase 3 | `Tests run: 0` or "No tests found" | **Adjust**: fix the class or method name from the source file; never add `-DskipTests`. |
| Phase 3 | Gradle prints `UP-TO-DATE` for `test` | **Retry**: re-run `test_one` with `--rerun-tasks`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
