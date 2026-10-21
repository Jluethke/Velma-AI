# TDD Java Mutation Testing With PIT

**One-line description:** Runs PIT (pitest) with the JUnit 5 plugin through Maven or Gradle on the changed classes, reads the line coverage, mutation coverage and test strength figures and the SURVIVED and NO_COVERAGE mutations in the HTML report, and kills each survivor with one red-first test or records it as equivalent.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `refactored_code` (object, required): Changed production classes and suite result from `tdd-refactor-under-green`.
- `coverage_report` (object, required): From `tdd-java-coverage`; used to scope target classes.
- `build_tool` (string, required): `maven` or `gradle`.

---

## Outputs

- `mutation_report` (object): PIT version, target classes, line coverage, mutation coverage, test strength, counts per status, and report path.
- `killing_tests` (object[]): Class, line, mutator description, new test, red evidence with the mutation hand-applied, green evidence after restore.
- `equivalent_mutants` (object[]): Class, line, mutator and reason.

---

## Phase 1: Configure and Run

### Entry Criteria
- Tests pass; `git status --porcelain` is empty.

### Actions
1. Maven: add `org.pitest:pitest-maven` (latest on Maven Central or the user's version) with a plugin dependency on `org.pitest:pitest-junit5-plugin`. Without the JUnit 5 plugin PIT finds no Jupiter tests.

```xml
<plugin>
  <groupId>org.pitest</groupId><artifactId>pitest-maven</artifactId><version>${pitest.version}</version>
  <dependencies>
    <dependency><groupId>org.pitest</groupId><artifactId>pitest-junit5-plugin</artifactId><version>${pitest.junit5.version}</version></dependency>
  </dependencies>
  <configuration>
    <targetClasses><param>com.example.pricing.*</param></targetClasses>
    <targetTests><param>com.example.pricing.*</param></targetTests>
  </configuration>
</plugin>
```

Run: `mvn test-compile org.pitest:pitest-maven:mutationCoverage`. Report: `target/pit-reports/` (`index.html`; older setups put it in a timestamped subfolder).
2. Gradle: apply the `info.solidsoft.pitest` plugin (check its README for the current version and the `junit5PluginVersion` setting), set `targetClasses` and `targetTests`, run `./gradlew pitest`. Report: `build/reports/pitest/index.html`.
3. Scope `targetClasses` to the packages changed in this cycle. Keep the default mutator group unless the user asks for `STRONGER`.

### Output
PIT report.

### Quality Gate
- Console shows `>> Line Coverage`, `>> Generated N mutations Killed M`, and `>> Test strength`.
- The HTML index exists.

---

## Phase 2: Read the Report

### Entry Criteria
- Report exists.

### Actions
1. Figures: Line Coverage (lines run by tests), Mutation Coverage (killed out of all generated), Test Strength (killed out of mutations that had coverage; the best measure of assertion quality).
2. Statuses:

| Status | Meaning | Action |
|---|---|---|
| KILLED | a test failed | none |
| TIMED_OUT, MEMORY_ERROR, RUN_ERROR | mutant broke execution; counted as detected | none |
| SURVIVED | covering tests all passed | Phase 3 |
| NO_COVERAGE | no test runs this line | uncovered code per `tdd-java-coverage` |
| NON_VIABLE | mutant bytecode invalid | ignore |

3. In the class page, each line has a mutation list such as `changed conditional boundary -> SURVIVED`, `negated conditional -> KILLED`, `replaced int return with 0 for com/example/Pricing::total -> SURVIVED`, `removed call to com/example/Audit::log -> SURVIVED`. Default mutators include ConditionalsBoundary, NegateConditionals, Math, Increments, InvertNegatives, return-value mutators (EmptyObjectReturnVals, FalseReturnVals, TrueReturnVals, NullReturnVals, PrimitiveReturns) and VoidMethodCall.
4. Record each SURVIVED with class, line, description and a behavior sentence.

### Output
Survivor list.

### Quality Gate
- Every SURVIVED entry for changed classes has a behavior sentence.

---

## Phase 3: Kill or Classify

### Entry Criteria
- Survivor list exists.

### Actions
1. For each survivor with an observable difference:
   a. Write the test (use `@ParameterizedTest` cases where a table exists). Run it alone (`mvn test -Dtest=Class#method` / `./gradlew test --tests '...'`): passes on the original.
   b. Hand-apply the described mutation in the source (for example change `>=` to `>` for "changed conditional boundary"). Run the test: must fail.
   c. `git restore <file>`. Run the full suite: green.
2. "removed call to ... VoidMethodCall" survivors: if the call's effect is a requirement (audit log written, event published), verify it through the collaborator's double (`verify(audit).log(...)`). If it is pure logging with no requirement, record as equivalent for this requirement.
3. Equivalent mutants: record the reason; exclude with `excludedMethods` or `avoidCallsTo` only if the project allows.
4. Rerun PIT; add `withHistory` (Maven `-DwithHistory`) to speed reruns if supported by the installed version (check the PIT docs).
5. Do not narrow `targetClasses` or delete assertions to raise the score.

### Output
`mutation_report`, `killing_tests`, `equivalent_mutants`.

### Quality Gate
- After the rerun, every former SURVIVED is KILLED or in `equivalent_mutants`.
- Each killing test has red output from step 1b.
- `git status --porcelain` shows only intended test changes.

---

## Worked Example

Illustrative only. Maven, `targetClasses` = `com.example.pricing.*`.

```
$ mvn -q test-compile org.pitest:pitest-maven:mutationCoverage
>> Line Coverage (for mutated classes only): 42/44 (95%)
>> Generated 31 mutations Killed 28 (90%)
>> Mutations with no coverage 1. Test strength 93%
```

`Pricing.java` line 18: `changed conditional boundary -> SURVIVED` on `if (qty >= BULK_QTY)`. Requirement: "BULK_QTY or more units get bulk price". Add `@CsvSource` case at exactly `BULK_QTY`; passes on original; with `>` hand-applied it fails with `expected: <450> but was: <500>`; restore; rerun shows KILLED.

---

## Exit Criteria

DONE when PIT ran with the JUnit 5 plugin over the changed classes, every SURVIVED mutation is killed by a test proven red against it or recorded as equivalent, and no hand-applied mutation remains.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `No mutations found` or zero tests run | **Adjust**: add `pitest-junit5-plugin` and check `targetClasses` matches real package names. |
| Phase 1 | `Tests failing without mutation` | **Stop**: PIT's baseline failed; fix order-dependent tests with `tdd-test-isolation-audit` first. |
| Phase 3 | Killing test fails on original | **Stop**: test or code is wrong; return to red. |
| Phase 3 | Requirement silent about the mutated behavior | **Return**: record an open question; not equivalent. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
