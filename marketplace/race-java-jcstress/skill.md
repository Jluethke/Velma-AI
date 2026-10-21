# Java Visibility and Atomicity Test With jcstress

**One-line description:** Writes an OpenJDK jcstress test for one shared Java field or class (non-volatile flag, double-checked locking, compound update on a concurrent map, unsafe publication) and reads the outcome histogram to prove which results the Java Memory Model allows on this JVM.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `shared_state_inventory` (object[], required): From `race-shared-state-inventory`; Java rows with guard `NONE`, `volatile`, or `INCONSISTENT` are candidates.

---

## Outputs

- `jcstress_results` (object[]): One row per test: `class_under_test`, `test_name`, `outcomes` (each result tuple with its count and its `Expect` label), `verdict` (`OK` or `FAILED`), `forbidden_seen` (tuples marked FORBIDDEN that occurred), `acceptable_interesting_seen`.

---

## Phase 1: Pick the Pattern and Create the jcstress Project

### Entry Criteria
- At least one Java inventory row is a candidate.
- Maven is available (`mvn -v`).

### Actions
1. Classify the candidate with this table and pick ONE:

| Code pattern | What jcstress can show |
|---|---|
| `boolean running` set by one thread, read in a loop by another, not `volatile` | Reader may never see the update (visibility) |
| Double-checked lazy init without `volatile` on the instance field | Reader sees a non-null reference to a partly built object |
| `map.get(k)` then `map.put(k, v+1)` on a `ConcurrentHashMap` | Lost update: each call is thread-safe, the pair is not |
| `long` or `double` field written without `volatile` | Torn read (JLS 17.7 allows non-atomic 64-bit writes) |
| Object published through a non-final, non-volatile field | Reader sees default field values |

2. Generate a separate jcstress module with the official archetype (check the jcstress README for the current archetype coordinates and version):
   `mvn archetype:generate -DinteractiveMode=false -DarchetypeGroupId=org.openjdk.jcstress -DarchetypeArtifactId=jcstress-java-test-archetype -DgroupId=<your.group> -DartifactId=jcstress-tests -Dversion=1.0`
3. Add the production module as a dependency of `jcstress-tests`, or copy the minimal class under test into the test with the same field modifiers. Copying is acceptable only if the copy keeps every modifier (`volatile`, `final`, `synchronized`) identical; record which you did.

### Output
A jcstress module that builds (`mvn -q -f jcstress-tests/pom.xml package` exits 0).

### Quality Gate
- `jcstress-tests/target/jcstress.jar` exists after `package`.
- The chosen table row is written down.

---

## Phase 2: Write the Test

### Entry Criteria
- Module builds.

### Actions
1. Write one test class using the real jcstress annotations. Example for a lost update on a `ConcurrentHashMap`:
   ```
   @JCStressTest
   @Outcome(id = "2", expect = Expect.ACCEPTABLE, desc = "Both increments visible")
   @Outcome(id = "1", expect = Expect.FORBIDDEN, desc = "Lost update")
   @State
   public class CounterMapLostUpdate {
       final Counters c = new Counters();       // class under test
       @Actor public void a1() { c.increment("k"); }
       @Actor public void a2() { c.increment("k"); }
       @Arbiter public void arbiter(I_Result r) { r.r1 = c.get("k"); }
   }
   ```
   `@Actor` methods run concurrently, `@Arbiter` runs after both, and the result type (`I_Result`, `II_Result`, `ZZ_Result`, `JJ_Result` and others in `org.openjdk.jcstress.infra.results`) holds the observed values.
2. Write an `@Outcome` for every result the code can produce. Label the ones the invariant forbids as `Expect.FORBIDDEN`, and outcomes legal but surprising as `Expect.ACCEPTABLE_INTERESTING`. Add `@Outcome(expect = Expect.FORBIDDEN, desc = "other")` with no id only if every other outcome is a bug.
3. For visibility tests with a reader that spins on a flag, use the `@JCStressTest(Mode.Termination)` mode with an `@Signal` method; the test reports whether the actor terminates. Check the jcstress samples (`JCStress_APISample_*` in the jcstress repository) for the exact shape before writing one.
4. Do not mark an outcome ACCEPTABLE because it occurs. Its label comes from the invariant and the Java Memory Model, never from the run.

### Output
Test class.

### Quality Gate
- `mvn -q -f jcstress-tests/pom.xml package` exits 0 with the test included.
- Every reachable result tuple has an `@Outcome` (list the tuples you derived from the code next to the annotations).

---

## Phase 3: Run and Read the Histogram

### Entry Criteria
- Test builds.

### Actions
1. Run only that test: `java -jar jcstress-tests/target/jcstress.jar -t CounterMapLostUpdate`. Check `java -jar jcstress.jar -h` for mode options; the default mode is the documented baseline and the result applies to this JVM and CPU only.
2. Read the console table and `results/index.html`. Each row shows `Observed state`, `Occurrences`, `Expectation`, `Interpretation`. The test line ends `[OK]` or `[FAILED]`.
3. Record every tuple with its count. Any non-zero count on a FORBIDDEN tuple is `FAILED` and proves the bug.
4. A zero count for a FORBIDDEN tuple on x86 does not prove safety on ARM (weaker hardware memory model). Record the CPU architecture (`uname -m`) next to the result and say whether the code relies on hardware ordering.

### Output
`jcstress_results`.

### Quality Gate
- Every row has occurrence counts copied from the jcstress output.
- The architecture is recorded with each result.

---

## Worked Example

Illustrative only.

Inventory row: `Counters.increment(k)` does `Integer v = map.get(k); map.put(k, v == null ? 1 : v + 1);` on a `ConcurrentHashMap`, guard `INCONSISTENT`.

Phase 3 output:
```
  Observed state   Occurrences   Expectation  Interpretation
               1         4,213     FORBIDDEN  Lost update
               2    98,771,402    ACCEPTABLE  Both increments visible
[FAILED] com.shop.CounterMapLostUpdate
```
Row: forbidden tuple `1` seen 4,213 times on `x86_64`. Fix direction for `race-sync-primitive-choice`: `map.merge(k, 1, Integer::sum)`, an atomic compound operation on `ConcurrentHashMap`. Rerun after the fix: `1` has 0 occurrences, `[OK]`.

---

## Exit Criteria

DONE when one jcstress test with fully labeled outcomes ran against the real class semantics, and the histogram with counts, verdict and architecture is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Gradle-only project | **Adjust**: keep the jcstress tests as a standalone Maven module, or use the jcstress Gradle plugin documented in its repository. |
| Phase 2 | Class under test needs Spring context | **Adjust**: test the smallest class that owns the field, constructed directly. |
| Phase 3 | FORBIDDEN never appears on x86 for a visibility bug | **Return**: record "not observed on x86_64"; the JMM still allows it, and the fix is still required when the code relies on visibility without `volatile` or locks. |
| Phase 3 | Run takes too long | **Adjust**: run with `-t <single test>` only, and check `-h` for a shorter mode on your jcstress version. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
