# C++ Randomized Differential Stress Test

**One-line description:** Runs a seeded randomized differential test of a C++ solution against the brute-force reference with a bash loop, a std::mt19937 generator, the solution built with AddressSanitizer, UBSan and libstdc++ debug mode so crashes surface as failures, and saves the minimized failing input as a counterexample.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `problem_spec` (object, required): Output of `algo-problem-restatement`, with constraint table and output contract.
- `solution_file` (string, required): Path of the solution, for example `sol.cpp`.
- `brute_file` (string, required): Path of the reference, for example `brute.cpp`.
- `brute_force_limits` (object, required): Output of `algo-brute-force-reference`, with `max_brute_n`.
- `edge_cases` (object[], required): Output of `algo-edge-case-enumeration`.
- `stress_iterations` (integer, optional): Number of random tests. If absent, **Stop** in Phase 2 and ask; this flow does not pick a count.
- `cpp_ub_report` (object, required): Output of `algo-cpp-overflow-ub-audit`; the audited solution is the one under test.

---

## Outputs

- `stress_report` (object): Build flags, generator description, seed range, count run, pass count, sanitizer findings, checker used, edge replay result.
- `counterexample` (object): Smallest failing input, both outputs or the sanitizer report, and the seed. Null when no failure was found.

---

## Phase 1: Generator, Checker, Builds

### Entry Criteria
- Solution and reference both pass all samples. Platform has bash (Linux, macOS, WSL or Git Bash).

### Actions
1. Write `gen.cpp`: `std::mt19937 rng(std::stoul(argv[1]));` and draw with `std::uniform_int_distribution<long long>(lo, hi)(rng)`. Do not use `rand()`: `RAND_MAX` can be as small as 32767 (it is on MSVC), which silently limits values. Note that `uniform_int_distribution` output is implementation-defined across standard libraries, so the same seed can give different inputs under GCC and MSVC; always save the failing input file, not just the seed.
2. Generator size rules: most tests tiny (n from 1 to a handful), some up to `max_brute_n`; values mostly from a small range to force ties and duplicates, some from the full range. For trees use `parent[i] = uniform(0, i-1)` and shuffle labels. Record the distribution.
3. Build three binaries:

```
g++ -std=c++17 -O2 gen.cpp -o gen
g++ -std=c++17 -O2 brute.cpp -o brute
g++ -std=c++17 -O1 -g -fsanitize=address,undefined -fno-sanitize-recover=all -D_GLIBCXX_DEBUG sol.cpp -o sol_check
```

The sanitized `sol_check` turns out-of-bounds reads and signed overflow into nonzero exits instead of silent wrong answers that happen to match.
4. Checker by contract:

| Contract | Comparison |
|---|---|
| unique | `diff -w o1.txt o2.txt` (or `cmp -s` when whitespace must match exactly) |
| any valid | `./check in.txt o1.txt o2.txt` validates the solution's answer against the input and compares its objective with the reference |
| real tolerance | `./check` comparing with the statement's tolerance |

### Output
`gen`, `brute`, `sol_check`, checker.

### Quality Gate
- `./gen 1 | md5sum` printed twice gives the same hash; `./gen 2 | md5sum` differs.
- All three builds finished with exit code 0.

---

## Phase 2: Run the Loop

### Entry Criteria
- Phase 1 complete; `stress_iterations` known.

### Actions
1. Write `stress.sh`:

```
#!/usr/bin/env bash
set -u
N=$1
for ((i = 1; i <= N; i++)); do
  ./gen "$i" > in.txt
  if ! timeout "$TL" ./sol_check < in.txt > o1.txt 2> err.txt; then echo "CRASH_OR_TLE seed $i"; cat err.txt | head -20; exit 1; fi
  ./brute < in.txt > o2.txt
  if ! diff -w o1.txt o2.txt > /dev/null; then echo "WA seed $i"; exit 1; fi
done
echo "OK $N"
```

Set `TL` to a value derived from `time_limit_seconds` in `problem_spec` and record it; sanitized builds run slower than `-O2`, so record the multiplier you chose as a user decision. `timeout` is GNU coreutils; on macOS it is `gtimeout` from coreutils.
2. Run `bash stress.sh <stress_iterations>`. Report the exact count.
3. Replay edge cases with the sanitized binary: `for f in edge_*.in; do ./sol_check < $f > got.txt && diff -w got.txt ${f%.in}.out || echo "FAIL $f"; done`.
4. Do not weaken the comparison (for example switching to comparing only the first token) to make the loop pass.

### Output
Loop and replay results.

### Quality Gate
- `stress.sh` printed `OK <stress_iterations>` or a failing seed line.
- The edge replay printed no FAIL line.

---

## Phase 3: Minimize and Report

### Entry Criteria
- Phase 2 finished.

### Actions
1. On failure, copy `in.txt` to `fail.in` immediately (the next run overwrites `in.txt`).
2. For CRASH: read `err.txt`. The sanitizer's first `#0` frame or the UBSan `file:line: runtime error:` line is the location. Record it in `counterexample`.
3. For WA: shrink `fail.in` by removing elements or lowering values one at a time while it still fails and stays valid. Hand-check the reference on the final input; if the reference is wrong, **Return** to `algo-brute-force-reference`.
4. Save `counterexample.in`, `o1.txt`, `o2.txt`. Do not edit `solution_file` here; return to the technique flow, then rerun this flow from Phase 2 with the same seeds.

### Output
`stress_report`, `counterexample`.

### Quality Gate
- If `counterexample` is not null, rerunning `./sol_check < counterexample.in` and `./brute < counterexample.in` now reproduces the failure.

---

## Worked Example

Illustrative. Count pairs with sum T; `max_brute_n` = 2000; `stress_iterations` = 5000; TL = 2 (1 second limit, multiplier 2 recorded as a user decision).

```
$ bash stress.sh 5000
CRASH_OR_TLE seed 41
.../debug/vector:...: Error: attempt to subscript container with out-of-bounds index 5, but container only holds 5 elements.
$ cp in.txt fail.in
```

- Phase 3: the `-O2` build had passed this seed silently; debug mode caught the read of `a[j + 1]` in the duplicate-skipping loop when j = n - 1 (the stack trace in `err.txt` points to `sol.cpp:27`). Minimized input: n = 2, T = 4, a = [2 2]. Returned to `algo-two-pointers`; after the loop guard was fixed, `bash stress.sh 5000` prints `OK 5000`.

---

## Exit Criteria

DONE when the sanitized solution matched the reference on the requested count and every edge replay passed, or when a reproducible counterexample with its location is saved and returned.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sanitizers unavailable (MinGW) | **Adjust**: run in WSL; record the platform. |
| Phase 2 | `stress_iterations` absent | **Stop**: ask the user for the count. |
| Phase 2 | Every test times out | **Adjust**: check that `TL` accounts for the sanitizer slowdown; run one input with `time` to measure. |
| Phase 3 | Failure only appears with `-O2`, not with `sol_check` | **Adjust**: build an `-O2 -g` binary for the loop as well and compare; suspect uninitialized reads. |
| Phase 3 | Reference wrong | **Return**: to `algo-brute-force-reference`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
