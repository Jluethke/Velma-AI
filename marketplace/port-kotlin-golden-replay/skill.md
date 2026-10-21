# Port Kotlin Golden Replay

**One-line description:** Builds a JUnit 5 `@TestFactory` in the Kotlin target that loads the frozen golden JSON Lines corpus from test resources, decodes typed values (`$int` to `Long` or `BigInteger`, `$f64` by raw bits, `$decimal` to `BigDecimal` with scale), compares doubles by `toRawBits()` instead of `==`, and emits one dynamic test per record, run through Gradle or Maven on the same JDK major version as the capture.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_repo` (string, required): Path to the Kotlin (Gradle or Maven) project.
- `golden_corpus` (object, required): Output of `port-golden-corpus-freeze`.
- `corpus_schema` (object, required): Output of `port-golden-corpus-schema`.

---

## Outputs

- `kotlin_replay_command` (object): The exact commands: full replay, one behavior, checksum test, and the JDK check, plus harness file paths.

---

## Phase 1: Copy, Verify, Pin the JDK

### Entry Criteria
- `golden_corpus.tag` exists in the source repository.

### Actions
1. Copy the tagged corpus: `git -C <source_repo> archive golden-v1 golden | tar -x -C src/test/resources/`.
2. Verify: `(cd src/test/resources/golden && sha256sum -c SHA256SUMS)`.
3. Compare the JDK major version with `java.version` in `golden/ENV.json`. Pin the test JVM to it: Gradle `kotlin { jvmToolchain(<N>) }` or `java { toolchain { languageVersion.set(JavaLanguageVersion.of(<N>)) } }`; Maven: run with that JDK on `JAVA_HOME`. Set the same system properties as the capture on the test task: `-Duser.timezone=UTC -Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8` (Gradle `tasks.test { jvmArgs(...) }`, Maven Surefire `argLine`).

### Output
Corpus on the test classpath, JDK pinned.

### Quality Gate
- `sha256sum -c SHA256SUMS` exits 0.
- The test task prints the JDK version it runs (add `println(System.getProperty("java.version"))` to a setup method) and its major version equals the capture's.

---

## Phase 2: Write the Harness

### Entry Criteria
- Corpus in place.

### Actions
1. Add test dependencies: `org.junit.jupiter:junit-jupiter` and a JSON tree library: Jackson `jackson-databind` (if the Java source used it) or `kotlinx-serialization-json` (`Json.parseToJsonElement(line)`).
2. `src/test/kotlin/golden/Codec.kt`:
   - `$int`: `BigInteger(s)`; convert with `longValueExact()` or `intValueExact()` (they throw `ArithmeticException` on overflow, which is the point) when the ported function takes `Long` or `Int`.
   - `$f64`: `java.lang.Double.longBitsToDouble(java.lang.Long.parseUnsignedLong(h, 16))`; `"nan"` to `Double.NaN`.
   - `$decimal`: `BigDecimal(s)` (keeps scale; `BigDecimal("2.50") == BigDecimal("2.5")` is false in Kotlin because `==` calls `equals`, which compares scale; that is the desired strictness).
   - `$bytes`: `java.util.Base64.getDecoder().decode(b)`.
   - `$badstr`: build the `String` from UTF-16LE code units; Kotlin strings can hold lone surrogates.
   - `encode(v: Any?)`: reverse; `Double` to `$f64` via `v.toRawBits()` formatted `"%016x".format(bits)` with NaN as `"nan"`; `Char` to `$int` code if the source recorded `char` that way.
3. `src/test/kotlin/golden/GoldenTest.kt`:
```kotlin
class GoldenTest {
    @TestFactory
    fun golden(): List<DynamicContainer> =
        behaviorFiles().map { file ->
            DynamicContainer.dynamicContainer(file.behavior, file.records.map { r ->
                DynamicTest.dynamicTest(r.id) {
                    val fn = Registry.calls[r.call]
                    Assumptions.assumeTrue(fn != null, "not ported yet")
                    val outcome = runCatching { fn!!(r.args, r.kwargs) }
                    Compare.check(r, outcome)   // rules.json + categories.json
                }
            })
        }
}
```
   - List resource files from a fixed index (`golden/MANIFEST.json` lists them) rather than scanning the classpath, which differs between Gradle, Maven and JAR runs.
   - Never compare decoded doubles with `==` or `assertEquals(Double, Double)` alone: for values statically typed `Double`, Kotlin `==` follows IEEE 754 (`-0.0 == 0.0` is true, `NaN == NaN` is false), while for `Any?` it calls `equals` (the opposite on both). Compare the encoded bit strings.
   - `runCatching` also catches `CancellationException` and `Error`; rethrow `Error` subclasses (`OutOfMemoryError`, `StackOverflowError`) unless a record expects them.
   - Map exceptions with `outcome.exceptionOrNull()!!::class.simpleName` through `categories.json`.
4. `ChecksumTest.kt` recomputes SHA-256 (`MessageDigest.getInstance("SHA-256")`) per file and compares to `SHA256SUMS`.

### Output
Harness files.

### Quality Gate
- With an empty registry, the run shows every record as skipped (assumption failed) and zero failures.
- Changing one byte in a copied resource file makes `ChecksumTest` fail; restore with `git checkout -- src/test/resources/golden`.

---

## Phase 3: Prove the Comparator and Commands

### Entry Criteria
- Harness runs.

### Actions
1. In a scratch branch, register a stub that returns `0.0` where a record expects `-0.0`; it must fail. Register a stub returning `BigDecimal("2.5")` where the record has `{"$decimal": "2.50"}`; it must fail. Delete the branch.
2. Record the commands:
   - Gradle: `./gradlew test --tests "golden.GoldenTest"`; one behavior: dynamic test filtering by display name is limited in Gradle, so set a system property `-Dgolden.only=B-007` that the factory reads to include only that behavior.
   - Maven: `mvn -q test -Dtest=GoldenTest -Dgolden.only=B-007` (pass the property through Surefire `systemPropertyVariables` or `argLine`).
   - Reports: `build/test-results/test/TEST-golden.GoldenTest.xml` or `target/surefire-reports/`.

### Output
`kotlin_replay_command`.

### Quality Gate
- Both stubs fail, with the failure lines attached.
- The XML report lists one `testcase` per record (`grep -c "<testcase" <report>` equals the record count, or the filtered count).

---

## Worked Example

Illustrative. Java to Kotlin, `invoice-core`, 205 records, JDK 21 at capture.
```
$ ./gradlew test --tests "golden.GoldenTest" -Dgolden.only=B-007
GoldenTest > golden() > B-007 > B-007/0012 FAILED
    expected {"$decimal":"2.35"} but was {"$decimal":"2.345"}
```
The Kotlin `round2` lost a `setScale(2, RoundingMode.HALF_UP)` call during conversion. After the fix:
```
BUILD SUCCESSFUL
$ grep -c "<testcase" build/test-results/test/TEST-golden.GoldenTest.xml
38
```

---

## Exit Criteria

DONE when the corpus is on the test classpath with verified checksums, the JDK matches the capture, every record is a dynamic test, the comparator catches `-0.0` and decimal scale, and commands are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Target JDK major version differs from the capture | **Stop**: run on the capture's version, or recapture on the new version as `golden-v2` with a reason; never mix. |
| Phase 2 | Resources not found when run from Maven | **Adjust**: load with `this::class.java.getResourceAsStream("/golden/...")` and a leading slash. |
| Phase 2 | Dynamic tests do not appear in reports | **Adjust**: confirm `useJUnitPlatform()` in Gradle or Surefire 2.22.0 or later in Maven. |
| Phase 3 | A wrong stub passes | **Stop**: the comparator uses `==` on doubles or ignores decimal scale; fix it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
