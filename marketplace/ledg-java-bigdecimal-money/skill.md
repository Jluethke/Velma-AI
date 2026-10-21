# Ledger Java BigDecimal Money

**One-line description:** Implements Java money handling with `long` minor units and `BigDecimal` for sub-unit math, removes the `new BigDecimal(double)`, `equals` scale and unbounded `divide` traps, and enforces them with SpotBugs and Error Prone checks.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the Maven or Gradle project.
- `money_representation_spec` (object, required): Output of `ledg-money-representation-decision`.

---

## Outputs

- `java_money_module` (object): The money class path, its API, the boundary fixes made (file and line), static analysis rules enabled, and the passing build command with its summary.

---

## Phase 1: Write the Money Class

### Entry Criteria
- `money_representation_spec` lists java types.
- `./mvnw -v` or `./gradlew --version` runs and reports a JDK 11 or later.

### Actions
1. Create one `final` class `Money` with fields `private final long minor; private final java.util.Currency currency;`. Edit this one file and compile before touching others.
2. Read the exponent from the spec and cross-check with `Currency.getInstance(code).getDefaultFractionDigits()`; throw `IllegalStateException` at startup if they differ, naming both values. The JDK returns -1 for pseudo-currencies such as XAU.
3. Add `static Money parse(String s, Currency c)`: `new BigDecimal(s)`, then `bd.setScale(exp, RoundingMode.UNNECESSARY)` (throws `ArithmeticException` if digits would be lost), then `unscaledValue().longValueExact()`.
4. Arithmetic: `plus` and `minus` use `Math.addExact` and `Math.subtractExact` so overflow throws `ArithmeticException` instead of wrapping; reject mixed currencies with `IllegalArgumentException`.
5. Rate math: `Money times(BigDecimal rate, RoundingMode mode)` computes `BigDecimal.valueOf(minor).multiply(rate).setScale(0, mode).longValueExact()`. The `RoundingMode` is always a parameter; there is no default.
6. Implement `equals` and `hashCode` on `minor` and `currency` only. No `BigDecimal` field means no scale-sensitive equality.

### Output
`Money.java`.

### Quality Gate
- `Money.parse("1.005", Currency.getInstance("USD"))` throws `ArithmeticException` in a unit test.
- `new Money(Long.MAX_VALUE, usd).plus(new Money(1, usd))` throws `ArithmeticException` in a unit test.

---

## Phase 2: Remove the BigDecimal Traps

### Entry Criteria
- `Money` compiles and its tests pass.

### Actions
1. Find `new BigDecimal(<double>)`: `rg -n --type java 'new BigDecimal\(\s*-?[0-9]+\.[0-9]'` and `rg -n --type java 'new BigDecimal\(\s*[a-z]\w*\s*\)'` then check each argument type. `new BigDecimal(0.1)` equals `0.1000000000000000055511151231257827021181583404541015625`. Replace with `new BigDecimal("0.1")`.
2. Find `.equals(` on BigDecimal values: `new BigDecimal("2.0").equals(new BigDecimal("2.00"))` is `false` because scale differs. Replace with `compareTo(...) == 0`. A `HashMap` or `HashSet` keyed by `BigDecimal` has the same problem; normalize keys with `stripTrailingZeros()` or key by `Money`.
3. Find `.divide(` with one argument: it throws `ArithmeticException: Non-terminating decimal expansion; no exact representable decimal result.` for 1/3. Replace with `divide(divisor, scale, RoundingMode.X)` where scale and mode come from `ledg-rounding-policy`.
4. Replace deprecated `BigDecimal.ROUND_HALF_UP` style int constants (deprecated since Java 9) with `RoundingMode` enum values.
5. Jackson: enable `DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS` on the `ObjectMapper` and write money as strings; enable `JsonGenerator.Feature.WRITE_BIGDECIMAL_AS_PLAIN` so `1E+2` style output never reaches clients.
6. JPA: minor units map to `long` with `@Column(nullable = false)` on a `bigint`; decimals map to `BigDecimal` with `@Column(precision = P, scale = S)` from the spec. Remove any `double` money field.
7. If JSR 354 (`org.javamoney:moneta`) is already in use, use `Money` (BigDecimal-backed) for ledger amounts; `FastMoney` is `long`-backed with a fixed scale of 5, so check that scale fits the spec before using it.

### Output
Boundary fixes list.

### Quality Gate
- The four `rg` searches above return no money hit.
- `./mvnw -q verify` or `./gradlew check` exits 0.

---

## Phase 3: Enforce With Static Analysis

### Entry Criteria
- Phase 2 build passes.

### Actions
1. SpotBugs: enable the plugin (`com.github.spotbugs:spotbugs-maven-plugin` or the `com.github.spotbugs` Gradle plugin) and confirm the detector `DMI_BIGDECIMAL_CONSTRUCTED_FROM_DOUBLE` is not excluded in any filter file.
2. Error Prone, if the build already uses it: make the bug patterns `BigDecimalLiteralDouble` and `BigDecimalEquals` errors with `-Xep:BigDecimalLiteralDouble:ERROR -Xep:BigDecimalEquals:ERROR`. Check the Error Prone bug pattern list for your version before adding flags.
3. Run the build and read the SpotBugs report (`target/spotbugsXml.xml` for Maven, `build/reports/spotbugs/` for Gradle). Zero `DMI_BIGDECIMAL_CONSTRUCTED_FROM_DOUBLE` entries is required.
4. Do not add `@SuppressFBWarnings` to make the build pass.

### Output
`java_money_module`.

### Quality Gate
- The SpotBugs report has zero `DMI_BIGDECIMAL_CONSTRUCTED_FROM_DOUBLE` bug instances: `rg -c DMI_BIGDECIMAL_CONSTRUCTED_FROM_DOUBLE target/spotbugsXml.xml` prints nothing or 0.
- The final build command exits 0 and its test summary shows 0 failures.

---

## Worked Example

Illustrative only.
```
jshell> new BigDecimal(0.1)
$1 ==> 0.1000000000000000055511151231257827021181583404541015625
jshell> new BigDecimal("2.0").equals(new BigDecimal("2.00"))
$2 ==> false
jshell> new BigDecimal("2.0").compareTo(new BigDecimal("2.00"))
$3 ==> 0
$ ./mvnw -q verify
[INFO] Tests run: 112, Failures: 0, Errors: 0, Skipped: 0
```
Phase 2 output lists `InvoiceService.java:88` changed from `a.divide(b)` to `a.divide(b, 4, RoundingMode.HALF_EVEN)` with scale 4 from the rounding policy.

---

## Exit Criteria

DONE when `Money` uses `long` minor units with exact-overflow checks, no BigDecimal trap remains in money code, SpotBugs reports zero BigDecimal-from-double findings, and the build passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | JDK currency digits differ from ISO spec | **Adjust**: trust the spec (ISO list one); record the JDK version and difference. |
| Phase 2 | Divide scale unknown | **Return**: request it from `ledg-rounding-policy`; do not pick a scale. |
| Phase 3 | Error Prone not in build | **Adjust**: rely on SpotBugs; do not add a new compiler plugin without the user's approval. |
| Phase 3 | Build green only with suppressions | **Stop**: remove suppressions and fix the code. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
