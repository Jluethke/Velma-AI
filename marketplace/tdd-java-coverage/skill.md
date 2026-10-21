# TDD Java Coverage With JaCoCo

**One-line description:** Adds JaCoCo to a Maven or Gradle build, produces the HTML, XML and CSV reports after tests, reads instruction, branch and line counters including the yellow partial-branch diamonds, and maps each gap to a behavior.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `refactored_code` (object, required): Files and suite result from `tdd-refactor-under-green`.
- `build_tool` (string, required): `maven` or `gradle`.
- `coverage_floor` (number, optional): Minimum covered ratio set by the user or project policy. When absent, no check rule is added.

---

## Outputs

- `coverage_report` (object): Counters (INSTRUCTION, BRANCH, LINE, METHOD) per class and total, and report paths.
- `uncovered_lines` (object[]): Each uncovered line or partial branch with class, line, classification and action.

---

## Phase 1: Wire JaCoCo

### Entry Criteria
- The test suite passes with `mvn test` or `./gradlew test`.

### Actions
1. Maven: add `org.jacoco:jacoco-maven-plugin` (use the latest version on Maven Central or the user's) with two executions: goal `prepare-agent` (default phase initialize) and goal `report` bound to phase `test`:

```xml
<plugin>
  <groupId>org.jacoco</groupId><artifactId>jacoco-maven-plugin</artifactId><version>${jacoco.version}</version>
  <executions>
    <execution><goals><goal>prepare-agent</goal></goals></execution>
    <execution><id>report</id><phase>test</phase><goals><goal>report</goal></goals></execution>
  </executions>
</plugin>
```

If Surefire has a custom `<argLine>`, write it as `<argLine>@{argLine} -your-flags</argLine>`, or the JaCoCo agent is dropped and the report is empty.
2. Gradle (`build.gradle.kts`): `plugins { jacoco }` and

```kotlin
tasks.test { finalizedBy(tasks.jacocoTestReport) }
tasks.jacocoTestReport { dependsOn(tasks.test); reports { xml.required = true; html.required = true } }
```

3. Run: Maven `mvn test` (report in `target/site/jacoco/index.html`, `jacoco.xml`, `jacoco.csv`); Gradle `./gradlew test` (report in `build/reports/jacoco/test/html/index.html`).

### Output
JaCoCo reports.

### Quality Gate
- The HTML index exists and its Total row shows a nonzero instruction count.
- `target/jacoco.exec` (Maven) or `build/jacoco/test.exec` (Gradle) exists.

---

## Phase 2: Read the Counters

### Entry Criteria
- Reports exist.

### Actions
1. Counters JaCoCo reports:

| Counter | Meaning |
|---|---|
| INSTRUCTION | Java bytecode instructions executed; the finest measure |
| BRANCH | each outcome of `if`, `switch`, `&&`, `\|\|`, ternary |
| LINE | a source line counts as covered when at least one instruction on it ran |
| METHOD, CLASS | at least one instruction ran |
| COMPLEXITY | cyclomatic complexity, with missed complexity estimating tests still needed |

2. In the per-file HTML: green line = fully covered, yellow = partly covered (some branches missed), red = not run. A diamond in the margin marks a branch line; hover it to read "1 of 2 branches missed".
3. For a machine list use `jacoco.csv` columns `CLASS, INSTRUCTION_MISSED, BRANCH_MISSED, LINE_MISSED` and list classes with misses; then open their HTML pages for line numbers.
4. Record every red line and yellow diamond for classes in `refactored_code`.

### Output
Draft `uncovered_lines`.

### Quality Gate
- Every class from `refactored_code` with `BRANCH_MISSED` or `LINE_MISSED` above zero in `jacoco.csv` has entries in `uncovered_lines`.

---

## Phase 3: Classify, Act and Optional Check

### Entry Criteria
- Draft list exists.

### Actions
1. Classify each entry: missing behavior (requirement covers it: new behavior row, go to red), dead code (delete under green), defensive only (keep, note it), or excluded (generated code such as Lombok: add `lombok.addLombokGeneratedAnnotation = true` to `lombok.config`, which JaCoCo filters; DTOs from code generators: add an `<excludes>` pattern).
2. No test may call code without asserting its result; PIT (`tdd-java-pitest`) finds such tests.
3. If `coverage_floor` is given, add a check rule and record the build result:
   - Maven: a `check` goal execution with a rule `<element>BUNDLE</element>`, limit `<counter>BRANCH</counter><value>COVEREDRATIO</value><minimum>${coverage_floor}</minimum>` (ratio form, for example 0.80 for 80 percent).
   - Gradle: `tasks.jacocoTestCoverageVerification { violationRules { rule { limit { counter = "BRANCH"; minimum = "<coverage_floor>".toBigDecimal() } } } }` and run `./gradlew jacocoTestCoverageVerification`.
   If not given, report totals without a verdict.

### Output
`coverage_report`, `uncovered_lines`.

### Quality Gate
- Each entry has a classification and action.
- Any check rule uses only `coverage_floor`.

---

## Worked Example

Illustrative only. Gradle project, class `com.example.Discounts`.

`./gradlew test` then open `build/reports/jacoco/test/html/com.example/Discounts.java.html`: line 27 `if (customer.isMember() && total > threshold)` is yellow, diamond says "1 of 4 branches missed" (member with total not above threshold never tested). Requirement: members below the threshold get no discount. Missing behavior, new row B06 with total exactly equal to the threshold (boundary).

---

## Exit Criteria

DONE when JaCoCo reports are produced by the normal test command, every red line and partial branch in the changed classes is classified with an action, and any check rule uses `coverage_floor`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Report says `Skipping JaCoCo execution due to missing execution data file` | **Adjust**: the agent did not attach; fix `@{argLine}` in Surefire or check `prepare-agent` runs before tests. |
| Phase 1 | Report empty for classes in other modules | **Adjust**: use the `report-aggregate` goal in a reporting module (Maven) or aggregate per the Gradle JaCoCo docs. |
| Phase 2 | Lombok getters lower the numbers | **Adjust**: add the Lombok config line, rebuild. |
| Phase 3 | Check fails | **Return**: report counters and classified gaps; do not lower the floor. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
