# C++ Overflow and Undefined Behavior Audit

**One-line description:** Audits a C++ algorithm solution for signed overflow, unsigned size underflow, out-of-bounds access, invalid sort comparators, stack overflow from large locals, and slow stream I/O, using GCC or Clang warnings, AddressSanitizer, UndefinedBehaviorSanitizer and libstdc++ debug mode, and reads each tool's report format.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`, with the integer width table.
- `solution_file` (string, required): Path of the C++ solution, for example `sol.cpp`.

---

## Outputs

- `cpp_ub_report` (object): Warning list, sanitizer findings with file:line, manual pattern grep results, the fix for each (one per edit), and the rerun result after each fix.

---

## Phase 1: Compiler Warnings

### Entry Criteria
- `solution_file` compiles and passes the samples.

### Actions
1. Compile with warnings as a report, not as the build used for timing:

```
g++ -std=c++17 -O2 -Wall -Wextra -Wshadow -Wconversion -Wsign-compare sol.cpp -o sol_warn 2> warnings.txt
```

2. Read `warnings.txt`. Act on these warning types, in this order:

| Warning text contains | Meaning | Fix |
|---|---|---|
| `comparison of integer expressions of different signedness` | int compared with `size()` (unsigned) | cast `(int)v.size()` or use a signed size variable |
| `conversion from 'long long int' to 'int' may change value` | 64-bit value stored in 32-bit | widen the destination per the width table |
| `declaration of 'x' shadows` | inner variable hides outer | rename |
| `may be used uninitialized` | read before write | initialize at declaration |
| `unused variable` | often a leftover from a deleted branch | check the logic, then remove |

3. Fix one warning class per edit and rerun samples after each.

### Output
Warning list and fixes.

### Quality Gate
- `grep -c "warning:" warnings.txt` on the final recompile prints 0, or every remaining warning is listed with a reason it is safe.

---

## Phase 2: Sanitizers and Debug Mode

### Entry Criteria
- Phase 1 complete. Platform is Linux, macOS or WSL (GCC on MinGW does not ship AddressSanitizer; on Windows use WSL, or MSVC `cl /fsanitize=address` which provides ASan but not UBSan).

### Actions
1. Build the checking binary:

```
g++ -std=c++17 -O1 -g -fsanitize=address,undefined -fno-sanitize-recover=all -D_GLIBCXX_DEBUG -D_GLIBCXX_DEBUG_PEDANTIC sol.cpp -o sol_check
```

`-fno-sanitize-recover=all` makes UBSan abort on the first error so the exit code shows it. `-D_GLIBCXX_DEBUG` turns on bounds and iterator checks in libstdc++ containers (`operator[]` on vector included). Debug mode changes container layout and complexity, so never use this binary for timing.
2. Run on every sample and edge case: `for f in sample*.in edge_*.in; do ./sol_check < $f > /dev/null || echo "FAIL $f"; done`.
3. Read the reports:

| Report starts with | Meaning |
|---|---|
| `runtime error: signed integer overflow: X * Y cannot be represented in type 'int'` | product computed in 32 bits; the file:line precedes the message |
| `runtime error: shift exponent 40 is too large for 32-bit type 'int'` | `1 << 40`; write `1LL << 40` |
| `ERROR: AddressSanitizer: heap-buffer-overflow` | index past a vector or new[] array; read the first `#0` stack frame for file:line |
| `ERROR: AddressSanitizer: stack-buffer-overflow` | index past a local array |
| `ERROR: AddressSanitizer: stack-overflow` | recursion too deep or huge local array |
| `Error: attempt to subscript container with out-of-bounds index` | libstdc++ debug mode bounds check |

4. Fix one finding per edit, rebuild `sol_check`, rerun the whole loop.

### Output
Sanitizer findings and fixes.

### Quality Gate
- The loop over all samples and edge cases prints no FAIL line with the final `sol_check`.

---

## Phase 3: Patterns Sanitizers Miss

### Entry Criteria
- Phase 2 complete.

### Actions
1. Grep and inspect each pattern:

| Pattern | Bug | Fix |
|---|---|---|
| `long long x = a * b;` with int a, b | multiplication happens in int before widening | `1LL * a * b` |
| `(lo + hi) / 2` | overflow when lo + hi exceeds the type | `lo + (hi - lo) / 2` |
| `v.size() - 1` | wraps to a huge unsigned value when v is empty | `(int)v.size() - 1` |
| `memset(a, x, sizeof a)` with x not 0 or -1 | sets bytes, not ints | `std::fill` |
| comparator with `<=` or `>=` | not a strict weak ordering; undefined behavior in `std::sort` | strict `<` |
| `pow(` on integers | double rounding | integer loop or binary exponentiation |
| `__builtin_popcount(` on 64-bit values | counts only 32 bits | `__builtin_popcountll` |
| large array declared inside `main` or a function | stack overflow (stack is commonly a few megabytes; read it with `ulimit -s` on Linux) | declare global or use `std::vector` |
| `endl` in a loop | flushes every line | `'\n'` |
| `cin` without `ios::sync_with_stdio(false); cin.tie(nullptr);` on large input | slow I/O | add both; then do not mix `scanf`/`printf` with streams |
| reference or iterator to a vector element kept across `push_back` | invalidated on reallocation | store indices |

2. Fix one pattern per edit and rerun both `sol_check` over all cases and the timing build over samples.

### Output
`cpp_ub_report`.

### Quality Gate
- Each pattern row has a recorded grep result (match lines or "none").
- The final `sol_check` loop and the `-O2` sample diffs both pass.

---

## Worked Example

Illustrative. `solution_file` = sol.cpp computing sum of a_i * b_i, n <= 2*10^5, values <= 10^9.

- Phase 1: `warnings.txt` contains `sol.cpp:18: comparison of integer expressions of different signedness` for `i < v.size() - 1`. Fixed with `(int)v.size() - 1`.
- Phase 2:

```
$ ./sol_check < edge_max_values.in > /dev/null
sol.cpp:23:21: runtime error: signed integer overflow: 1000000000 * 1000000000 cannot be represented in type 'int'
```

Line 23 `s += a[i] * b[i];` (s is `long long`, a and b are `vector<int>`) changed to `s += 1LL * a[i] * b[i];`. Loop rerun: no FAIL.
- Phase 3: `grep -n "endl" sol.cpp` shows line 30 in the output loop; replaced with `'\n'`.

---

## Exit Criteria

DONE when warnings are cleared or justified, sanitizer and debug-mode runs pass on all cases, every manual pattern is checked, and the `-O2` build still passes the samples.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `-fsanitize=address` not supported (MinGW) | **Adjust**: run in WSL or use clang on Linux; record the platform used. |
| Phase 2 | Sanitizer passes but `-O2` build gives a different answer | **Adjust**: suspect uninitialized memory or a strict-aliasing issue; add `-fsanitize=memory` with clang on Linux, or initialize every variable. |
| Phase 3 | Stack overflow persists after moving arrays | **Adjust**: convert deep recursion to an explicit stack. |
| Any | A fix changes a correct sample answer | **Retry**: revert that one edit and redo it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
