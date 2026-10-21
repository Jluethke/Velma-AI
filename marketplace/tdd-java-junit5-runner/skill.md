# TDD JUnit 5 Runner Setup

**One-line description:** Wires JUnit 5 (Jupiter) into a Maven or Gradle build so tests are actually discovered, proves a canary passes and fails, and records the single-class, single-method and continuous-build commands, guarding against the silent zero-tests-run trap.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Root of the Java project (folder with `pom.xml` or `build.gradle(.kts)`).
- `build_tool` (string, required): `maven` or `gradle`.

---

## Outputs

- `runner_config` (object): `build_file`, `junit_bom_version` (as found or chosen by the user), `suite_command`, `single_test_command` (template), `watch_command`, `report_dir`.
- `smoke_result` (object): Tests-run counts and exit codes for the canary pass run and fail run.

---

## Phase 1: Add JUnit Jupiter to the Build

### Entry Criteria
- `java -version` prints a version. `build_tool` matches the build file present.

### Actions
1. Find the current JUnit version: open the build file and search for `junit`. If JUnit 4 (`junit:junit`) is present, keep it only if old tests need it and add `org.junit.vintage:junit-vintage-engine`; otherwise new tests use Jupiter only.
2. Maven (`pom.xml`): import the BOM and add the aggregate artifact. Use the latest version listed on Maven Central for `org.junit:junit-bom`, or the version the user names; do not guess a number.

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.junit</groupId><artifactId>junit-bom</artifactId>
      <version>${junit.version}</version><type>pom</type><scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
<dependencies>
  <dependency>
    <groupId>org.junit.jupiter</groupId><artifactId>junit-jupiter</artifactId><scope>test</scope>
  </dependency>
</dependencies>
```

Make sure `maven-surefire-plugin` is version 2.22.0 or newer (3.x preferred); older Surefire runs zero Jupiter tests. Check with `mvn help:effective-pom | grep -A2 surefire`.
3. Gradle (`build.gradle.kts`):

```kotlin
dependencies {
    testImplementation(platform("org.junit:junit-bom:<version>"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
tasks.test { useJUnitPlatform() }
```

Without `useJUnitPlatform()` Gradle finds no Jupiter tests and the build is still green.

### Output
Build file declares Jupiter and a platform-aware test runner.

### Quality Gate
- Maven: effective POM shows Surefire 2.22.0 or newer. Gradle: `grep -n useJUnitPlatform build.gradle*` finds a line.
- `mvn -q test-compile` or `./gradlew testClasses` exits 0.

---

## Phase 2: Canary Pass and Fail

### Entry Criteria
- Test sources compile.

### Actions
1. Create `src/test/java/<package path>/CanaryTest.java`:

```java
package com.example;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

class CanaryTest {
    @Test
    void runnerExecutesTests() {
        assertEquals(2, 1 + 1);
    }
}
```

`assertEquals(expected, actual)`: expected comes FIRST in JUnit. Swapping them produces misleading failure messages.
2. Run Maven `mvn -q test -Dtest=CanaryTest` or Gradle `./gradlew test --tests 'com.example.CanaryTest'`. Expect Maven `Tests run: 1, Failures: 0` / Gradle `BUILD SUCCESSFUL`, exit 0.
3. Change expected `2` to `3`. Run again. Expect `expected: <3> but was: <2>`, `Tests run: 1, Failures: 1`, `BUILD FAILURE` / `BUILD FAILED`, nonzero exit.
4. Delete `CanaryTest.java`. Record both runs.
5. Confirm the count is not zero. Maven prints `Tests run: 0` when discovery fails; Gradle prints nothing special, so open `build/reports/tests/test/index.html` or `build/test-results/test/*.xml` and confirm one test ran.

### Output
`smoke_result`.

### Quality Gate
- The pass run reports exactly 1 test run (Surefire line, or one `<testcase>` in Gradle XML results).
- The fail run shows `expected: <3> but was: <2>`.

---

## Phase 3: Selection and Continuous Build

### Entry Criteria
- Canary proved pass and fail.

### Actions
1. Record:

| Purpose | Maven | Gradle |
|---|---|---|
| Full suite | `mvn test` | `./gradlew test` |
| One class | `mvn test -Dtest=UserServiceTest` | `./gradlew test --tests 'com.example.UserServiceTest'` |
| One method | `mvn test -Dtest=UserServiceTest#rejectsDuplicateEmail` | `./gradlew test --tests 'com.example.UserServiceTest.rejectsDuplicateEmail'` |
| Multi-module: one class in one module | `mvn test -pl core -Dtest=UserServiceTest -Dsurefire.failIfNoSpecifiedTests=false` | `./gradlew :core:test --tests '...'` |
| Rerun even if up to date | not needed | add `--rerun` (Gradle 7.6+) or `--rerun-tasks` |
| Watch | none built in | `./gradlew test --continuous` (or `-t`) |
| Reports | `target/surefire-reports/` | `build/reports/tests/test/index.html` |

2. Gradle marks `test` UP-TO-DATE and skips it when nothing changed; that is not a pass. Look for `> Task :test UP-TO-DATE` and use `--rerun` when you need a real run.
3. Use `@DisplayName("rejects duplicate email")` for readable reports and `@Nested` classes to group by condition. Use `assertThrows(IllegalArgumentException.class, () -> ...)` for exception behaviors, never try/catch with `fail()`.

### Output
`runner_config`.

### Quality Gate
- The one-method command, run on any existing test, reports exactly 1 test run.
- For Gradle, `watch_command` = `./gradlew test --continuous`; for Maven it is "none" unless the user names a plugin.

---

## Worked Example

Illustrative only. Gradle Kotlin DSL project, package `com.example`.

Phase 1: add the three dependency lines and `tasks.test { useJUnitPlatform() }`.

Phase 2 fail run:

```
CanaryTest > runnerExecutesTests() FAILED
    org.opentest4j.AssertionFailedError: expected: <3> but was: <2>
1 test completed, 1 failed
BUILD FAILED in 3s
```

Phase 3: `single_test_command` = `./gradlew test --tests '{fqcn}.{method}'`, `report_dir` = `build/reports/tests/test`.

---

## Exit Criteria

DONE when Jupiter is on the test classpath, the build runs it through the JUnit Platform, a canary was seen passing and failing with a nonzero test count, it is removed, and commands are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `package org.junit.jupiter.api does not exist` | **Adjust**: the dependency is missing or not in test scope; fix the build file. |
| Phase 2 | Build green but zero tests ran | **Stop**: add `useJUnitPlatform()` (Gradle) or upgrade Surefire (Maven) before any TDD work. |
| Phase 2 | `No tests matching pattern` / `No tests were executed` | **Retry**: use the fully qualified class name for Gradle and check the class is under `src/test/java`. |
| Phase 3 | Gradle `:test UP-TO-DATE` hides a stale result | **Retry**: rerun with `--rerun`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
