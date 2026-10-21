# Java Runtime Pitfalls Audit for Algorithm Solutions

**One-line description:** Audits a Java algorithm solution for the JVM and library traps that break correct algorithms: slow Scanner input and unbuffered output, quadratic worst case of Arrays.sort on primitive arrays, Integer identity comparison, silent int overflow, negative remainders, StackOverflowError from deep recursion, and boxing overhead in collections.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`, with the integer width table.
- `solution_file` (string, required): Path of the Java solution, for example `Sol.java`.

---

## Outputs

- `java_runtime_report` (object): Each check with its grep command, matching lines, the fix applied (one per edit), and the rerun result after each fix.

---

## Phase 1: Input and Output

### Entry Criteria
- `solution_file` compiles with `javac Sol.java` and passes the samples.

### Actions
1. `grep -n "new Scanner" Sol.java`. `java.util.Scanner` parses with regular expressions and is slow on large inputs. Replace with `BufferedReader` plus `StringTokenizer`, or a `DataInputStream` byte reader:

```
BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
StringTokenizer st = new StringTokenizer("");
String next() throws IOException { while (!st.hasMoreTokens()) st = new StringTokenizer(br.readLine()); return st.nextToken(); }
```

2. `grep -n "System.out.print" Sol.java`. Inside loops, replace with one `PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(System.out)));` and call `out.flush()` (or `out.close()`) once at the end. Missing the flush prints nothing, which reads as a wrong answer.
3. One edit at a time; after each: `javac Sol.java && for f in sample*.in; do java Sol < $f > got.txt && diff -w got.txt ${f%.in}.out || echo "FAIL $f"; done`.

### Output
Fast I/O applied, with rerun results.

### Quality Gate
- `grep -c "new Scanner" Sol.java` prints 0, or the report states the input is small.
- `grep -n "flush\|close" Sol.java` shows the writer is flushed.

---

## Phase 2: Sorting, Equality, Arithmetic

### Entry Criteria
- Phase 1 complete.

### Actions
1. Inspect each pattern:

| Grep | Problem | Fix |
|---|---|---|
| `Arrays.sort(` on `int[]`, `long[]` | primitive sort is a dual-pivot quicksort with an O(n^2) worst case on crafted inputs (anti-quicksort tests exist on judges with hacks) | shuffle the array with `java.util.Random` before sorting, or sort a `Long[]`/`Integer[]` (object sort is TimSort, O(n log n) worst case) or a `List` with `Collections.sort` |
| `==` between `Integer` or `Long` objects | compares identity; the `Integer` cache only guarantees identity for -128..127 (JLS 5.1.7) | `.equals()` or unbox to `int` |
| `(a, b) -> a - b` in comparators | overflow for large opposite-sign values | `Integer.compare(a, b)` or `Comparator.comparingInt` |
| `int` products or sums of large values | silent wraparound | `long` per the width table; during debugging use `Math.multiplyExact` and `Math.addExact`, which throw `ArithmeticException` on overflow |
| `%` with possibly negative left operand | result keeps the dividend's sign (`-7 % 3 == -1`) | `Math.floorMod(x, m)` |
| `Math.abs(` on `int` | `Math.abs(Integer.MIN_VALUE)` is negative | widen to `long` first |
| `Math.pow(` for integer powers | double rounding | integer loop or binary exponentiation |
| `String +=` in a loop | quadratic copying | `StringBuilder` |

2. Fix one row per edit; rerun the sample loop after each.

### Output
Pattern results and fixes.

### Quality Gate
- Each table row has a recorded grep result (match lines or "none").
- The sample loop prints no FAIL line after the last edit.

---

## Phase 3: Recursion and Memory

### Entry Criteria
- Phase 2 complete.

### Actions
1. Compute maximum recursion depth from the constraints (path graph DFS depth = n).
2. If deep: preferred fix is an explicit stack. Alternative: run the solver in a thread with a requested stack size, `new Thread(null, () -> solve(), "main", stackBytes).start();`. The Javadoc states the stack size argument is a request the JVM may ignore on some platforms, so test it with the maximum-depth case. Choose `stackBytes` within `memory_limit_mb` and record it.
3. Collections of boxed values (`ArrayList<Integer>`, `HashMap<Integer,Integer>`) use far more memory than `int[]`. For n at the maximum, prefer primitive arrays; for adjacency lists, use CSR arrays (head, next, to) or `int[][]` built from degree counts.
4. Enable assertions in testing runs only: `java -ea Sol < X.in`.
5. Run the maximum-depth and maximum-size edge cases and check the exit code: `java Sol < edge_max_depth.in > /dev/null; echo $?` must print 0 (an uncaught `StackOverflowError` exits with 1).

### Output
`java_runtime_report`.

### Quality Gate
- The maximum-depth case exits with code 0.
- All samples and edge cases pass after the last edit.

---

## Worked Example

Illustrative. `solution_file` = Sol.java, n <= 2*10^5, sorts an `int[]` and runs DFS on a tree.

- Phase 1: `new Scanner(System.in)` on line 5 replaced with `BufferedReader` and `StringTokenizer`; `System.out.println` in the query loop replaced with a `PrintWriter`, `out.flush()` at the end. Samples rerun: no FAIL.
- Phase 2: `Arrays.sort(a)` on `int[]` at line 20: shuffled first with `new Random()` swaps. `(x, y) -> x[0] - y[0]` at line 31 replaced with `Comparator.comparingInt(x -> x[0])`.
- Phase 3: recursive DFS depth up to 2*10^5; converted to an explicit `int[]` stack.

```
$ javac Sol.java && java Sol < edge_path_max.in > /dev/null; echo $?
0
```

---

## Exit Criteria

DONE when input and output are buffered, every sorting, equality and arithmetic row is checked, recursion cannot overflow on the maximum-depth case, and all cases pass after the last edit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Output empty after switching to `PrintWriter` | **Adjust**: add `out.flush()` before `main` returns. |
| Phase 2 | `ArithmeticException` from `multiplyExact` | **Adjust**: that value needs `long`; widen per the width table, then remove the exact-math call if speed matters. |
| Phase 3 | `StackOverflowError` with the larger thread stack | **Adjust**: convert to an explicit stack; the requested size may be ignored. |
| Any | A fix changes a correct sample answer | **Retry**: revert that one edit and redo it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
