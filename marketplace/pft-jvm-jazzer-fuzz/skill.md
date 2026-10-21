# JVM Fuzzing with Jazzer

**One-line description:** Writes a Jazzer `@FuzzTest` JUnit 5 method (taking a `FuzzedDataProvider` or typed parameters) for a Java or Kotlin target, runs it in fuzzing mode with `JAZZER_FUZZ=1` for a fixed duration, reads Jazzer's `== Java Exception:` and bug-detector findings with their `DEDUP_TOKEN`, and keeps the crash inputs in the `Inputs` resource directory so plain `mvn test` replays them.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fuzz_targets` (object[], required): JVM targets and harness contracts.
- `seed_corpus` (object[], required): Seed `Inputs` directories from `pft-corpus-seeding`.
- `fuzz_dictionary` (object[], optional): Dictionary paths (used in standalone mode only).
- `repo_path` (string, required): Maven or Gradle project root.
- `fuzz_time` (string, required): Duration per target in Jazzer's `maxDuration` format (for example `10m`), chosen by the user.

---

## Outputs

- `jvm_fuzz_findings` (object[]): One row per finding: test class and method, exception or detector name, `DEDUP_TOKEN`, crash file path under the `Inputs` directory, and top project stack frames.

---

## Phase 1: Add Jazzer and Write the Test

### Entry Criteria
- JUnit 5 tests run with `mvn test` or `./gradlew test`.

### Actions
1. Add `com.code-intelligence:jazzer-junit` as a test dependency with the version from the Jazzer README (Maven `<scope>test</scope>` or Gradle `testImplementation`). Keep `junit-jupiter` in the build.
2. Create `src/test/java/<pkg>/<Target>FuzzTest.java`:

```java
import com.code_intelligence.jazzer.api.FuzzedDataProvider;
import com.code_intelligence.jazzer.junit.FuzzTest;

class XmlConfigFuzzTest {
    @FuzzTest(maxDuration = "<fuzz_time>")
    void parse(FuzzedDataProvider data) {
        String xml = data.consumeRemainingAsString();
        try {
            XmlConfig.parse(xml);
        } catch (XmlConfig.InvalidConfigException e) {
            // allowed by the harness contract
        }
    }
}
```

3. FuzzedDataProvider methods: `consumeInt(min, max)`, `consumeBoolean()`, `consumeString(maxLength)`, `consumeAsciiString(maxLength)`, `consumeBytes(maxLength)`, `consumeRemainingAsString()`, `consumeRemainingAsBytes()`, `pickValue(collection)`. Typed parameters like `void parse(byte[] input)` or `void parse(String s)` also work; check the Jazzer README for supported types in your version.
4. Never catch `Exception`, `RuntimeException` or `Throwable` in the method. Never call `System.exit`.

### Output
Fuzz test class.

### Quality Gate
- Plain `mvn test -Dtest=XmlConfigFuzzTest` (or `./gradlew test --tests XmlConfigFuzzTest`) exits 0; this is regression mode, which runs only the stored inputs.

---

## Phase 2: Run in Fuzzing Mode

### Entry Criteria
- Regression mode passes.

### Actions
1. Fuzzing mode is enabled by an environment variable. Run one test at a time:

```bash
JAZZER_FUZZ=1 mvn test -Dtest=XmlConfigFuzzTest
# or
JAZZER_FUZZ=1 ./gradlew test --tests XmlConfigFuzzTest
```

2. Jazzer prints libFuzzer status lines (`INITED`, `NEW`, `pulse`) while it runs. It stops at `maxDuration` or at the first finding.
3. Read a finding:

```text
== Java Exception: com.code_intelligence.jazzer.api.FuzzerSecurityIssueHigh: Remote JNDI Lookup
...
== Java Exception: java.lang.StringIndexOutOfBoundsException: begin 0, end -1, length 3
	at java.base/java.lang.String.substring(String.java:2709)
	at com.acme.XmlConfig.attrName(XmlConfig.java:188)
DEDUP_TOKEN: 6b2f0a4c9d1e7a33
== libFuzzer crashing input ==
```

`FuzzerSecurityIssue*` lines come from Jazzer's built-in bug detectors (for example OS command injection, deserialization, SQL injection, SSRF, path traversal, regex injection, expression language injection). Other exceptions are uncaught runtime errors.
4. Jazzer saves the crash input into the test's `Inputs` resource directory (`src/test/resources/<pkg path>/XmlConfigFuzzTestInputs/parse/crash-<sha1>`). Confirm with `git status --short src/test/resources`.

### Output
Findings with crash inputs.

### Quality Gate
- The log contains `INITED` (proves fuzzing mode ran).
- Each finding has a `DEDUP_TOKEN` line and a new `crash-` file under `Inputs`.

---

## Phase 3: Replay and Record

### Entry Criteria
- Run finished.

### Actions
1. Replay all stored inputs with regression mode (no env var): `mvn test -Dtest=XmlConfigFuzzTest`. Each crash input must fail with the same exception.
2. Record per finding: exception or detector name, `DEDUP_TOKEN`, crash file, and the top three frames inside the project package.
3. Do not delete the crash files: once fixed, they are the regression tests. Do not add a broader `catch` to make the replay pass.
4. For a standalone run (outside JUnit, needed for `-dict=`), check `jazzer --help` for `--cp`, `--target_class` and `--instrumentation_includes`, and pass libFuzzer flags such as `-dict=` and `-max_total_time=` after them.

### Output
`jvm_fuzz_findings`.

### Quality Gate
- Every finding replays in regression mode with the same exception class.
- Every finding row has a `DEDUP_TOKEN`.

---

## Worked Example

Illustrative. Target `XmlConfig.parse`, `fuzz_time` = `10m` (user choice).

```text
$ JAZZER_FUZZ=1 mvn -q test -Dtest=XmlConfigFuzzTest
INFO: Instrumented com.acme.XmlConfig (took 41 ms, size +22%)
#2      INITED cov: 233 ft: 233 corp: 1/1b exec/s: 0 rss: 410Mb
#3305   NEW    cov: 260 ft: 281 corp: 7/58b lim: 33 exec/s: 1652 rss: 431Mb
== Java Exception: java.lang.StringIndexOutOfBoundsException: begin 0, end -1, length 3
	at com.acme.XmlConfig.attrName(XmlConfig.java:188)
DEDUP_TOKEN: 6b2f0a4c9d1e7a33
$ git status --short src/test/resources
?? src/test/resources/com/acme/XmlConfigFuzzTestInputs/parse/crash-2c7b0f...
$ mvn -q test -Dtest=XmlConfigFuzzTest     # replays and fails with the same exception
```

Finding: an attribute without `=` makes `indexOf` return -1 and `substring(0, -1)` throws.

---

## Exit Criteria

DONE when each JVM target ran in fuzzing mode for `fuzz_time`, and every finding has a stored crash input that replays in regression mode, with its `DEDUP_TOKEN` and frames recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `@FuzzTest` not discovered | **Adjust**: ensure the JUnit Jupiter engine runs and Surefire or Gradle uses the JUnit Platform. |
| Phase 2 | Runs only stored inputs and exits | **Retry**: `JAZZER_FUZZ=1` was not exported to the forked test JVM; set it in the shell that runs the build, or in the Surefire `environmentVariables` config. |
| Phase 2 | Several fuzz tests selected in fuzzing mode | **Retry**: select one test method; fuzzing mode runs one fuzz test per run. |
| Phase 3 | Replay does not fail | **Adjust**: target holds static state; reset it at the start of the method and rerun. |
| Phase 3 | Finding is in a third-party library | **Return**: record it with the library and version; report upstream rather than patching the jar. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
