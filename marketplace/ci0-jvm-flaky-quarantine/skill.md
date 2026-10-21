# Quarantine Flaky JUnit 5 Tests With Tags in Maven or Gradle

**One-line description:** Tags confirmed flaky JUnit 5 tests with `@Tag("quarantine")`, excludes the tag from the blocking build via Surefire `excludedGroups` or Gradle `excludeTags`, runs only that tag in a non-blocking CI job, and links each test to an issue.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository checkout.
- `flaky_tests` (object[], required): From `ci0-flaky-detect-junit`; only `confirmed: true` entries.
- `ci_platform` (string, required): `github` or `gitlab`.

---

## Outputs

- `quarantine_record` (object): `{marked_tests: [{test_id, issue_url}], build_tool, blocking_count_before, blocking_count_after, quarantine_job_name, diff}`.

---

## Phase 1: Confirm JUnit Platform and Tag Support

### Entry Criteria
- Confirmed entries exist.

### Actions
1. Check the test engine: `grep -nE 'junit-jupiter|junit:junit|junit-vintage' pom.xml build.gradle* gradle/libs.versions.toml 2>/dev/null`.

| Found | Mechanism |
|---|---|
| `junit-jupiter` (JUnit 5) | `@Tag("quarantine")` from `org.junit.jupiter.api.Tag` |
| `junit:junit` only (JUnit 4) | `@Category(Quarantine.class)` with a marker interface; Surefire `excludedGroups` takes the class name |
| TestNG | `groups = "quarantine"`; Surefire `excludedGroups` works for TestNG groups too |

2. Gradle must use the JUnit Platform for tags: `grep -n 'useJUnitPlatform' build.gradle*`.
3. Record the blocking count before from a full test run's reports: `find . \( -path '*/surefire-reports/TEST-*.xml' -o -path '*/test-results/test/TEST-*.xml' \) -print0 | xargs -0 cat | grep -c '<testcase'`.

### Output
Mechanism and baseline count.

### Quality Gate
- The engine is identified from a dependency line.
- Baseline count is a number computed from report files.

---

## Phase 2: Tag Tests and Configure Builds

### Entry Criteria
- Mechanism chosen.

### Actions
1. Create one issue per test with failure messages and rerun counts.
2. Annotate each method (not the class, unless every method is flaky):
```java
// Quarantined: https://github.com/acme/ledger/issues/58
@Tag("quarantine")
@Test
void renewsLeaseBeforeExpiry() { ... }
```
3. Maven: make the exclusion property-driven so CI can flip it without editing the POM:
```xml
<properties>
  <quarantine.exclude>quarantine</quarantine.exclude>
</properties>
...
<plugin>
  <artifactId>maven-surefire-plugin</artifactId>
  <configuration>
    <excludedGroups>${quarantine.exclude}</excludedGroups>
  </configuration>
</plugin>
```
   Quarantine run: `./mvnw -B -ntp test -Dgroups=quarantine -Dquarantine.exclude=`. Check the Surefire docs for your version: `groups` and `excludedGroups` are the parameter names (user properties `groups` and `excludedGroups`).
4. Gradle (Kotlin DSL):
```kotlin
tasks.test {
    useJUnitPlatform { excludeTags("quarantine") }
}
tasks.register<Test>("quarantineTest") {
    testClassesDirs = sourceSets["test"].output.classesDirs
    classpath = sourceSets["test"].runtimeClasspath
    useJUnitPlatform { includeTags("quarantine") }
    ignoreFailures = true
}
```
5. Do not use `@Disabled`, `@Ignore`, or delete tests. Do not add `rerunFailingTestsCount` to the blocking build as a substitute.

### Output
Tagged tests and build config.

### Quality Gate
- `grep -rn '@Tag("quarantine")' --include='*.java' --include='*.kt' . | wc -l` equals the number of confirmed tests.
- The blocking build still passes locally: `./mvnw -B -ntp verify` or `./gradlew build` exits 0.

---

## Phase 3: Split CI Jobs

### Entry Criteria
- Builds configured.

### Actions
1. Blocking job: unchanged command (exclusion is the default).
2. Quarantine job: Maven `./mvnw -B -ntp test -Dgroups=quarantine -Dquarantine.exclude=`; Gradle `./gradlew quarantineTest`. Non-blocking: GitHub `continue-on-error: true` and outside the aggregate check's `needs`; GitLab `allow_failure: true`. Upload its reports.
3. Compare: blocking count after + quarantine count == before, from the report files of each job.
4. Lint the CI file and push.

### Output
`quarantine_record`.

### Quality Gate
- Count equation holds using report-file totals.
- The quarantine job's reports list every tagged test.

---

## Worked Example

Illustrative only. Maven, JUnit 5, one confirmed `LeaseServiceTest.renewsLeaseBeforeExpiry`.

Phase 1: `pom.xml:58: <artifactId>junit-jupiter</artifactId>`. Baseline 506.
Phase 2: tag added; issue #58; Surefire `excludedGroups` bound to property.
Phase 3: blocking reports total 505; `./mvnw -B -ntp test -Dgroups=quarantine -Dquarantine.exclude=` reports `Tests run: 1, Failures: 0`. 505 + 1 = 506. CI: `test success`, `quarantine success`.

---

## Exit Criteria

DONE when every confirmed flaky JVM test carries the quarantine tag and an issue link, the blocking build excludes it by configuration, and a non-blocking job runs exactly the tagged tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Mixed JUnit 4 and 5 (vintage engine) | **Adjust**: tag JUnit 5 tests with `@Tag` and JUnit 4 tests with `@Category`; configure both. |
| Phase 2 | Surefire version too old for `excludedGroups` with JUnit 5 | **Return**: report the version; upgrading the plugin is a user decision. |
| Phase 3 | Quarantine job runs zero tests | **Adjust**: the empty `-Dquarantine.exclude=` override is missing, so the tag is both included and excluded. |
| Phase 3 | Counts do not add up | **Stop**: another `excludedGroups` value exists; merge, do not replace. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
