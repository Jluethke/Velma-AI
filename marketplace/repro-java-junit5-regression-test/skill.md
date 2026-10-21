# Java Failing Regression Test with JUnit 5

**One-line description:** Converts the minimal repro into one JUnit 5 (Jupiter) test using `assertThrows`, `assertEquals` or AssertJ when present, `@TempDir` for files, and a `Clock` for time, then confirms the red run with a single-method Maven Surefire or Gradle filter.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `minimal_repro` (object, required): Output of `repro-ddmin-minimize`.
- `minimal_input` (object, required): Output of `repro-ddmin-minimize`.
- `repo_path` (string, required): Absolute path to the local clone.

---

## Outputs

- `java_regression_test` (object): Test class path, method name, full source, the single-test run command, and the red run output including the Surefire report path. Empty when `stack` is not java.

---

## Phase 1: Identify Build Tool and Test Library

### Entry Criteria
- `java -version` matches `env_snapshot`.

### Actions
1. Build tool: `pom.xml` means Maven; `build.gradle` or `build.gradle.kts` means Gradle. Prefer the wrapper (`./mvnw`, `./gradlew`) when present.
2. JUnit version: search the build file for `junit-jupiter` (JUnit 5) or `junit:junit` (JUnit 4). This flow covers JUnit 5; for JUnit 4 use `@Test(expected=...)` or `assertThrows` from `org.junit.Assert` (4.13+) and the same run commands.
3. Assertion library: `org.assertj` present means use AssertJ; else `org.junit.jupiter.api.Assertions`.
4. Locate the mirror test class: for `src/main/java/com/acme/io/CsvReader.java` the test is `src/test/java/com/acme/io/CsvReaderTest.java`. Add the method there or create the class in that package.

### Output
Build tool, libraries, test class.

### Quality Gate
- Running an existing test method in the class with the Phase 3 command passes.

---

## Phase 2: Write the Test

### Entry Criteria
- Libraries known.

### Actions
1. Method name states behavior: `readsUtf8BomHeader()`; add `@DisplayName` only if neighbors use it.
2. Files: `@TempDir Path tmp` parameter; write with `Files.write(tmp.resolve("in.csv"), bytes)`.
3. Time: if the code under test takes a `java.time.Clock`, pass `Clock.fixed(Instant.parse("..."), ZoneId.of("..."))`. If it calls `LocalDate.now()` directly, run the test JVM with `-Duser.timezone=<zone>` (Maven: `-DargLine="-Duser.timezone=<zone>"`, which replaces any `argLine` in the POM, so check for one first) and record that in the run command.
4. Assertions:

| Bug kind | JUnit 5 Assertions | AssertJ |
|---|---|---|
| Wrong value | `assertEquals(expected, actual)` (expected first) | `assertThat(actual).isEqualTo(expected)` |
| Collections | `assertIterableEquals(expected, actual)` | `assertThat(list).containsExactly(...)` |
| Should throw | `var e = assertThrows(IllegalArgumentException.class, () -> f(x)); assertEquals("msg", e.getMessage());` | `assertThatThrownBy(() -> f(x)).isInstanceOf(IllegalArgumentException.class).hasMessage("msg")` |
| Should not throw | Call directly; `assertDoesNotThrow` adds nothing | Call directly |
| Hang | `assertTimeoutPreemptively(Duration.ofSeconds(<reported wait>), () -> f(x))` | same |

5. Never use `@Disabled`, and never catch `Exception` in the test body.
6. Edit only the test class and `src/test/resources/` fixtures.

### Output
Test source.

### Quality Gate
- `git diff --stat` shows only `src/test/` paths.
- The method has `@Test` from `org.junit.jupiter.api` (check the import line).

---

## Phase 3: Confirm the Red Run

### Entry Criteria
- Test written.

### Actions
1. Run one method:
   - Maven: `./mvnw -q test -Dtest='CsvReaderTest#readsUtf8BomHeader' -Dsurefire.failIfNoSpecifiedTests=false` (the last property keeps multi-module builds from failing in modules without that test; add `-pl <module> -am` to target the module).
   - Gradle: `./gradlew test --tests 'com.acme.io.CsvReaderTest.readsUtf8BomHeader' --info`.
2. Read the result: Maven prints `Tests run: 1, Failures: 1` (assert failure) or `Errors: 1` (unexpected exception). Gradle prints `CsvReaderTest > readsUtf8BomHeader() FAILED`. Full traces: Maven `target/surefire-reports/com.acme.io.CsvReaderTest.txt`; Gradle `build/test-results/test/TEST-com.acme.io.CsvReaderTest.xml`.
3. `Errors: 1` with the reported exception counts as red. `Errors: 1` with `NoClassDefFoundError`, `ParameterResolutionException`, or a compile error does not; fix the test.
4. Check `Tests run: 1`. If it says `Tests run: 0`, the filter matched nothing (wrong method name or a JUnit 4/5 engine mismatch).

### Output
`java_regression_test` with red output.

### Quality Gate
- Report shows exactly one test run with one failure or error, and its trace contains the reported exception class and message.
- No compilation error in the build output.

---

## Worked Example

Illustrative only.

```java
@Test
void readsUtf8BomHeader(@TempDir Path tmp) throws IOException {
    Path f = tmp.resolve("in.csv");
    Files.write(f, "\uFEFFid,name\n1,a\n".getBytes(StandardCharsets.UTF_8)); // UTF-8 with BOM
    List<Map<String, String>> rows = CsvReader.read(f);
    assertEquals(Map.of("id", "1", "name", "a"), rows.get(0));
}
```

`./mvnw -q test -Dtest='CsvReaderTest#readsUtf8BomHeader'` prints `Tests run: 1, Failures: 1` with `expected: <{id=1, name=a}> but was: <{U+FEFF id=1, name=a}>`. Java's UTF-8 decoder does not strip a BOM, so the stray U+FEFF in the first key reproduces the reported "missing id column". Red confirmed.

---

## Exit Criteria

DONE when one JUnit test method fails with the reported symptom, the run reports exactly one test, and only test sources changed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Project mixes JUnit 4 and 5 without the vintage engine | **Adjust**: write the test in the version the class already uses. |
| Phase 3 | `Tests run: 0` | **Retry**: fix the filter spelling; check the class is under `src/test/java`. |
| Phase 3 | Surefire version too old for `#method` filter | **Adjust**: check `mvn help:effective-pom` for the plugin version and the Surefire docs for supported syntax. |
| Phase 3 | Weak model adds `@Disabled` to get the build green | **Stop**: remove it; the test must be red until the fix. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
