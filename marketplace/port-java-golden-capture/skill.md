# Port Java Golden Capture

**One-line description:** Runs the original Java classes over every planned case input from a JUnit 5 capture test with a pinned JVM (fixed time zone, locale, charset, injected `Clock`), and writes observed results and exceptions as golden records in the typed JSON Lines schema, so the Kotlin port can be checked against the same records on the same JVM.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the Java repository at the reference commit (Maven or Gradle).
- `corpus_schema` (object, required): Output of `port-golden-corpus-schema`.
- `case_inputs` (object[], required): Output of `port-edge-case-input-set`.
- `nondeterminism_sources` (object[], required): Output of `port-nondeterminism-inventory`.

---

## Outputs

- `java_corpus` (object): Path to the written `golden/` directory, record count per behavior, the capture command, and the environment block (JDK vendor and version, `user.timezone`, `user.language`, `file.encoding`).

---

## Phase 1: Build the Capture Test

### Entry Criteria
- Source at `reference_commit` with clean `git status --porcelain`; `mvn -q test-compile` or `./gradlew testClasses` succeeds.

### Actions
1. Create `src/test/java/golden/GoldenCaptureTest.java` (test scope only, so it never ships). Tag it `@Tag("golden-capture")` and exclude that tag from the normal test run so it runs only on demand.
2. Use Jackson (`com.fasterxml.jackson.core:jackson-databind`, test scope) only as a JSON tree reader and writer; do the typed encoding by hand so nothing is lost:
   - `decode`: `$int` to `long` via `Long.parseLong` when the parameter is `long`/`int` (range-checked with `Math.toIntExact`), or `new BigInteger(s)`; `$f64` to `Double.longBitsToDouble(Long.parseUnsignedLong(h, 16))`; `$bytes` to `Base64.getDecoder().decode(b)`; `$badstr` with `utf-16-surrogatepass` to a `String` built from the UTF-16LE units (Java strings can hold lone surrogates).
   - `encode`: `Integer`, `Long`, `Short`, `Byte`, `BigInteger` to `$int`; `Double`, `Float` (widen with `(double) f`) to `$f64` using `Double.doubleToRawLongBits` with NaN written as `"nan"`; `String` to plain text unless it contains a lone surrogate (check each `char` with `Character.isSurrogate` and pairing); `BigDecimal` to `$decimal` with `toPlainString()` (keeps scale); `Map` to `$map` (a `HashMap`'s order is unspecified, so sort entries by canonical key text and record the field as unordered unless the map is a `LinkedHashMap` or `TreeMap`); `Set` to `$set`; `Instant` and `ZonedDateTime` to `$instant` in UTC; `Optional` to the value or `null` with a `"$optional": true` marker added to `SCHEMA.md`; `char` to `$int` code (Kotlin `Char` is not a number, so record the type in tags).
   - `call`: invoke by reflection (`Class.forName`, `getMethod` with the parameter types from `behavior_inventory`). Unwrap `InvocationTargetException` with `getCause()` before mapping the exception's simple class name through `golden/categories.json`.
3. Apply `nondeterminism_sources`: pass a `Clock.fixed(Instant.parse("2024-01-02T03:04:05Z"), ZoneOffset.UTC)` where the source accepts a `Clock`; for `new Random(seed)` pass the seed; mask the rest.
4. Do NOT edit files under `src/main/java`.

### Output
`GoldenCaptureTest.java` plus build config to run it on demand.

### Quality Gate
- `git -C <source_repo> diff --stat -- src/main` prints nothing.
- A self-test method in the class round-trips one value of every typed encoding, including `-0.0`, `NaN`, `Long.MIN_VALUE`, and a lone surrogate, and passes.

---

## Phase 2: Capture

### Entry Criteria
- Self-test passes.

### Actions
1. Run only the capture test with a pinned JVM:
   - Maven: `mvn -q test -Dgroups=golden-capture -DargLine="-Duser.timezone=UTC -Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8"` (Surefire's `groups` selects JUnit 5 tags).
   - Gradle: add a task of type `Test` that calls `useJUnitPlatform { includeTags("golden-capture") }` and sets `jvmArgs("-Duser.timezone=UTC", "-Duser.language=en", "-Duser.country=US", "-Dfile.encoding=UTF-8")`, then `./gradlew goldenCapture`.
2. The test writes `golden/B-*.jsonl` relative to the project root and prints a summary line.
3. Run it again into `golden2/` and `diff -r golden golden2`.

### Output
`golden/*.jsonl`.

### Quality Gate
- Records written equals cases read, and `wc -l golden/*.jsonl` agrees.
- `diff -r golden golden2` prints nothing.
- `jq -c . golden/*.jsonl > /dev/null` exits 0.

---

## Phase 3: Record the Environment

### Entry Criteria
- Two identical captures.

### Actions
1. Write `golden/ENV.json` with `java -XshowSettings:properties -version 2>&1 | grep -E "java.version|java.vendor|user.timezone|file.encoding"` output, the frozen instant, and the reference commit. Double formatting changed in JDK 19 and the default charset in JDK 18, so the Kotlin port must be tested on the same major JDK.
2. Set `java_corpus`.

### Output
`java_corpus`.

### Quality Gate
- `jq . golden/ENV.json` exits 0 and contains `java.version` and the reference commit.

---

## Worked Example

Illustrative. Source `invoice-core` (Java 21, Maven), 205 cases.
```
$ mvn -q test -Dgroups=golden-capture -DargLine="-Duser.timezone=UTC -Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8"
golden: cases=205 records=205 ok=181 error=24 (invalid_argument=20, arithmetic=4)
$ diff -r golden golden2; echo $?
0
```
Record showing why `BigDecimal` scale is kept:
```
{"id":"B-007/0012","behavior":"B-007","call":"com.acme.invoice.Totals.round2","input":{"args":[{"$decimal":"2.345"}],"kwargs":{},"stdin":null,"env":{},"files":{}},"expect":{"kind":"ok","value":{"$decimal":"2.35"}},"tags":["rounding:half_up"]}
```
The 4 `arithmetic` records are `ArithmeticException: / by zero` from integer division in `Ratio.java:31`.

---

## Exit Criteria

DONE when every case input has one golden record captured on a pinned JVM, two captures are identical, `src/main` is unmodified, and JDK version and properties are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Method overloads make reflection ambiguous | **Adjust**: record exact parameter types per behavior in `behavior_inventory` and use them in `getMethod`. |
| Phase 1 | Source calls `Instant.now()` with no `Clock` parameter | **Adjust**: mask the field; do not add a `Clock` parameter to `src/main` during capture. |
| Phase 2 | Surefire runs zero tests | **Adjust**: check the Surefire version supports JUnit 5 tags (2.22.0 or later) and that `junit-jupiter-engine` is on the test classpath. |
| Phase 2 | Captures differ between runs | **Return**: to `port-nondeterminism-inventory` with the record id. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
