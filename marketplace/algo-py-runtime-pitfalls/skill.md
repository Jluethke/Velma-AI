# Python Runtime Pitfalls Audit for Algorithm Solutions

**One-line description:** Audits a Python algorithm solution for the CPython and PyPy runtime traps that turn a correct algorithm into a time limit, recursion crash or wrong answer: slow line-by-line input, deep recursion past the default limit, hidden O(n) list operations, floor division and modulo sign rules, float precision, and tuple comparison in heaps.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`, with the constraint table and widths.
- `solution_file` (string, required): Path of the Python solution, for example `sol.py`.

---

## Outputs

- `py_runtime_report` (object): Each check with its grep or run command, the matching lines, the fix applied (one per edit), and the sample rerun result after each fix.

---

## Phase 1: Input and Output Speed

### Entry Criteria
- `solution_file` runs and passes the samples.

### Actions
1. Search for slow input: `grep -n "input()" sol.py`. If input size (from the constraint table) has many tokens, replace with one bulk read:

```
import sys
data = sys.stdin.buffer.read().split()
```

then walk an index over `data` and convert with `int(...)`. Bytes tokens convert with `int()` directly; strings need `.decode()`.
2. Search for printing in a loop: `grep -n "print(" sol.py`. If print runs once per answer line inside a loop over many queries, collect strings in a list and call `sys.stdout.write("\n".join(out) + "\n")` once.
3. Make exactly one of these edits at a time and rerun the samples after each:

```
for f in sample*.in; do python sol.py < $f > got.txt && diff -w got.txt ${f%.in}.out || echo "FAIL $f"; done
```

### Output
Fast I/O applied where needed, with rerun results.

### Quality Gate
- `grep -c "input()" sol.py` prints 0, or the report states the input has few lines and why it is fine.
- The sample loop prints no FAIL line after every edit.

---

## Phase 2: Recursion

### Entry Criteria
- Phase 1 complete.

### Actions
1. Find recursive functions: look for a `def f(` whose body calls `f(`. Also count `@lru_cache` and `@functools.cache` decorated functions: each call adds frames.
2. Compute maximum recursion depth from the constraints (for DFS on a path graph, depth = n; for memoized DP on prefix i, depth = n).
3. CPython's default recursion limit is 1000 (`python -c "import sys; print(sys.getrecursionlimit())"` prints it). Decide:

| Max depth | Action |
|---|---|
| below the current limit | no change |
| above the limit | preferred: convert to an explicit stack or bottom-up loop |
| above the limit and conversion is impractical | raise `sys.setrecursionlimit(depth + margin)` AND run the solver in a thread with a larger stack: `threading.stack_size(bytes)` then `threading.Thread(target=main).start()`; choose bytes so it stays under `memory_limit_mb` and record the value as a user decision |

4. On older CPython versions every Python-level call also consumed C stack, so raising the limit alone could crash the interpreter with a segmentation fault instead of a `RecursionError`. CPython 3.11 stopped using C stack for most pure-Python calls, and 3.12 made the limit apply only to Python code. Run `python --version` and read the "What's New" page for that version before relying on either behavior. Prefer conversion.
5. PyPy: deep recursion is slower than on CPython in many cases; iterative code is the safe choice for both.

### Output
Recursion decision per function.

### Quality Gate
- The maximum-depth edge case (path graph or longest chain) exits with code 0: `python sol.py < edge_max_depth.in > /dev/null; echo $?` prints 0.

---

## Phase 3: Hidden Complexity and Semantics

### Entry Criteria
- Phase 2 complete.

### Actions
1. Grep each pattern and fix only lines inside loops that run up to n times:

| Pattern | Cost | Fix |
|---|---|---|
| `.pop(0)`, `.insert(0,` | O(n) per call | `collections.deque` with `popleft` / `appendleft` |
| `x in some_list` inside a loop | O(n) per test | build a `set` once |
| `s += ` on strings inside a loop | quadratic in total length (CPython sometimes optimizes it, do not rely on it) | append to a list, `"".join` once |
| slicing `a[i:]` or `a[1:]` in recursion | O(n) copy per call | pass indices |
| `sorted(...)` or `.sort()` inside a loop | O(n log n) per iteration | sort once, or use `heapq` or `bisect.insort` with care (insort is O(n)) |
| `list.index`, `list.count` inside a loop | O(n) per call | precompute a dict |
| `copy.deepcopy` | proportional to object size | copy only what changes |

2. Semantics differences from C++ and Java that change answers:

| Construct | Python behavior | Risk |
|---|---|---|
| `-7 // 2` | -4 (floor) | formulas written for truncation give a different value |
| `-7 % 3` | 2 (sign of the divisor) | fine for modular arithmetic; differs from C++ |
| `int(math.sqrt(x))` for large x | float rounding can be off by one | use `math.isqrt(x)` |
| float equality, `0.1 + 0.2 == 0.3` | False | compare integers, or use `fractions.Fraction` for exact rationals |
| `heapq` with `(key, obj)` on equal keys | compares obj | add a counter tie-breaker |
| `numpy` int64 arrays | silent wraparound on overflow | Python ints for big sums |

3. Hash collisions: CPython hashes small ints to themselves, so a dict or set keyed by crafted integers can degrade toward O(n) per operation on adversarial tests. If the judge allows hacks or adversarial tests, key by `x ^ R` with a random R chosen at startup, or by a tuple; record the decision.
4. If PyPy is available and allowed by the judge, time both: `time python sol.py < edge_max.in > /dev/null` and `time pypy3 sol.py < edge_max.in > /dev/null`.

### Output
`py_runtime_report`.

### Quality Gate
- Each table row has a recorded grep result (match lines or "none").
- The sample loop and every edge case pass after the last edit.

---

## Worked Example

Illustrative. `solution_file` = sol.py, a BFS on a tree with n <= 2*10^5 read by `input()` and a recursive DFS.

- Phase 1: `grep -n "input()" sol.py` shows lines 4 and 7 inside a loop of n - 1 edges. Replaced with `sys.stdin.buffer.read().split()`. Samples rerun: no FAIL.
- Phase 2: recursive `dfs(v)`, depth up to 2*10^5 on a path, above the limit of 1000. Converted to an explicit stack. `python sol.py < edge_path_max.in > /dev/null; echo $?` prints 0.
- Phase 3: `grep -n "pop(0)" sol.py` shows line 22 in the BFS loop; replaced with `deque.popleft()`. `time python sol.py < edge_max.in` went from 9.8 s to 0.71 s on this machine.

---

## Exit Criteria

DONE when input and output are bulk operations where the size requires it, no recursion can exceed the limit on the maximum-depth case, every hidden-cost pattern has a grep result and fix, and all samples and edge cases pass after the last edit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Parsing breaks after the bulk read (strings vs bytes) | **Adjust**: decode the string tokens with `.decode()`; rerun samples. |
| Phase 2 | Segmentation fault after raising the recursion limit | **Adjust**: convert to an explicit stack; do not raise the limit further. |
| Phase 3 | A fix changes an answer | **Retry**: revert that one edit, reread the table row, apply it again. |
| Phase 3 | Still over the time limit after all fixes | **Return**: to `algo-py-complexity-doubling` to check the complexity class, then consider PyPy or a different `stack`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
