# Java Randomized Differential Stress Test

**One-line description:** Runs a seeded randomized differential test of a Java solution against the brute-force reference in a single JVM (a driver calling both solve methods, avoiding per-test JVM startup), with assertions enabled, exact-math overflow detection, and a minimized counterexample saved on failure.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`, with constraint table and output contract.
- `solution_file` (string, required): Path of the solution, for example `Sol.java`.
- `brute_file` (string, required): Path of the reference, for example `Brute.java`.
- `brute_force_limits` (object, required): Output of `algo-brute-force-reference`, with `max_brute_n`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stress_iterations` (integer, optional): Number of random tests. If absent, **Stop** in Phase 2 and ask; this flow does not pick a count.
- `java_runtime_report` (object, required): Output of `algo-java-runtime-pitfalls`; the audited solution is the one under test.

---

## Outputs

- `stress_report` (object): Driver design, generator description, seed range, count run, pass count, exceptions seen, checker used, edge replay result.
- `counterexample` (object): Smallest failing input as text, both outputs or the exception stack trace, and the seed. Null when no failure was found.

---

## Phase 1: Separate Solve from I/O

### Entry Criteria
- `Sol.java` and `Brute.java` pass all samples.

### Actions
1. Refactor both files so each has a `static String solve(String input)` (or a typed signature such as `static long solve(int[] a, long k)`) and a `main` that only reads stdin, calls `solve`, and prints. This is the one structural edit this flow allows; rerun the samples after it.
2. Make `solve` free of static state, or reset all static fields at its start. Leftover static arrays from a previous call are the most common false mismatch in an in-process driver.
3. Write `Gen.java` with `static String gen(long seed)` using `new java.util.Random(seed)`. `java.util.Random` is a specified linear congruential generator, so a seed gives the same sequence on every JVM. Draw n mostly tiny, sometimes up to `max_brute_n`; values mostly from a small range, sometimes the full range. Record the distribution.
4. Checker by contract:

| Contract | Comparison |
|---|---|
| unique | compare whitespace-split tokens: `got.trim().split("\\s+")` arrays with `Arrays.equals` |
| any valid | `Check.valid(input, got, expected)` validates the answer against the input and compares the objective value |
| real tolerance | parse doubles, compare with the statement's tolerance |

### Output
Refactored solve methods, `Gen.java`, checker.

### Quality Gate
- After the refactor, every sample still passes: `javac *.java && for f in sample*.in; do java Sol < $f > got.txt && diff -w got.txt ${f%.in}.out || echo "FAIL $f"; done` prints nothing.
- `Gen.gen(1)` equals `Gen.gen(1)` and differs from `Gen.gen(2)` (assert it in the driver's first lines).

---

## Phase 2: In-Process Driver Loop

### Entry Criteria
- Phase 1 complete; `stress_iterations` known.

### Actions
1. Write `Stress.java`:

```
public class Stress {
  public static void main(String[] args) {
    int n = Integer.parseInt(args[0]);
    for (long seed = 1; seed <= n; seed++) {
      String in = Gen.gen(seed);
      String exp = Brute.solve(in);
      String got;
      try { got = Sol.solve(in); }
      catch (Throwable t) { System.out.println("EXCEPTION seed " + seed); System.out.println(in); t.printStackTrace(System.out); return; }
      if (!java.util.Arrays.equals(got.trim().split("\\s+"), exp.trim().split("\\s+"))) {
        System.out.println("MISMATCH seed " + seed); System.out.println(in); return;
      }
    }
    System.out.println("OK " + n);
  }
}
```

2. Compile and run with assertions on: `javac *.java && java -ea Stress <stress_iterations>`. `-ea` enables `assert` statements in the solution.
3. During this run, temporarily guard suspected overflow points in `Sol.solve` with `Math.addExact` and `Math.multiplyExact`; an overflow then shows up as `ArithmeticException` with a line number instead of a silent mismatch. Record which lines were guarded.
4. Replay edge cases through the real `main` (this also checks the I/O path): `for f in edge_*.in; do java Sol < $f > got.txt && diff -w got.txt ${f%.in}.out || echo "FAIL $f"; done`.
5. Optional: property-based testing with jqwik (`net.jqwik:jqwik` on the JUnit 5 platform) gives automatic shrinking; check its user guide for the current annotations before using it.

### Output
Driver result and edge replay result.

### Quality Gate
- `java -ea Stress <stress_iterations>` printed `OK <stress_iterations>` or a failing seed with its input.
- The edge replay printed no FAIL line.

---

## Phase 3: Minimize and Report

### Entry Criteria
- Phase 2 finished.

### Actions
1. On failure, save the printed input to `fail.in`. Confirm it reproduces through `main`: `java Sol < fail.in` versus `java Brute < fail.in`. If it fails only in the driver, the cause is static state carried between calls: reset it and rerun Phase 2.
2. Shrink `fail.in` one element or value at a time while it still fails and stays valid. Hand-check the reference on the final input; if the reference is wrong, **Return** to `algo-brute-force-reference`.
3. Save `counterexample.in` and both outputs or the stack trace. Remove the temporary exact-math guards only after the fix is verified, or keep them if speed allows. Do not edit the comparison to pass.

### Output
`stress_report`, `counterexample`.

### Quality Gate
- If `counterexample` is not null, `java Sol < counterexample.in` and `java Brute < counterexample.in` differ (or throw) when run now.

---

## Worked Example

Illustrative. Minimize the largest part sum when splitting into m parts; `max_brute_n` = 10; `stress_iterations` = 20000.

```
$ javac *.java && java -ea Stress 20000
EXCEPTION seed 7731
3 1
1000000000 1000000000 1000000000
java.lang.ArithmeticException: integer overflow
	at java.base/java.lang.Math.addExact(Math.java:...)
	at Sol.feasible(Sol.java:22)
```

- Phase 3: `Sol.java:22` summed into an `int`; three values of 10^9 sum to 3*10^9, above 2^31 - 1. Already minimal (two values sum to 2*10^9, which still fits). Returned to `algo-binary-search-answer`; after widening to `long`, `java -ea Stress 20000` prints `OK 20000`.

---

## Exit Criteria

DONE when the in-process driver matched the reference on the requested count with assertions on and every edge replay passed through `main`, or when a reproducible counterexample is saved and returned.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Refactor breaks a sample | **Retry**: revert and redo the refactor; change only the I/O boundary. |
| Phase 2 | `stress_iterations` absent | **Stop**: ask the user for the count. |
| Phase 2 | Mismatch only after many seeds, not reproducible via `main` | **Adjust**: reset static fields at the start of `solve`; rerun. |
| Phase 3 | `StackOverflowError` in the driver but not in `main` | **Adjust**: the driver runs on the default main thread stack; run the driver inside the same larger-stack thread the solution uses. |
| Phase 3 | Reference wrong | **Return**: to `algo-brute-force-reference`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
