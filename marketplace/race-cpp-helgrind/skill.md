# Helgrind and DRD Cross-Check for C and C++

**One-line description:** Runs the unmodified C or C++ test binary under Valgrind's Helgrind and DRD tools to find races, lock-order violations and POSIX pthread API misuse when ThreadSanitizer cannot be used or needs a second opinion, and separates real findings from known C++11 atomics false positives.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `stress_command` (string, required): From `race-stress-harness`; names the test binary.

---

## Outputs

- `cpp_helgrind_reports` (object[]): One row per distinct finding: `tool` (`helgrind` or `drd`), `kind` (`Possible data race`, `lock order violated`, `pthread API misuse`, `conflicting load/store`), `site_a`, `site_b` (file:line), `locks_held`, `confirmed_by_other_tool` (true when both tools or TSan report the same pair), `raw_log`.

---

## Phase 1: Prepare and Run

### Entry Criteria
- Linux or another platform Valgrind supports (`valgrind --version` prints a version). Valgrind does not run natively on Windows.
- The test binary is built with `-g` and without any `-fsanitize` flag. Valgrind and sanitizers do not mix.

### Actions
1. Build a debug binary in its own directory: `cmake -S "<repo_path>" -B build-vg -DCMAKE_BUILD_TYPE=Debug && cmake --build build-vg -j`. `-O0` or `-O1` keeps line numbers accurate.
2. Run Helgrind on one iteration of the stress test first (Valgrind serializes threads and is slow):
   `valgrind --tool=helgrind --error-exitcode=1 --log-file=/tmp/hg.%p.log ./build-vg/<test_binary> <test filter args>`
3. Run DRD on the same binary:
   `valgrind --tool=drd --error-exitcode=1 --log-file=/tmp/drd.%p.log ./build-vg/<test_binary> <test filter args>`
4. Repeat each run as many times as `stress_command` specifies, or as many as time allows; record the count actually run. Valgrind runs threads one at a time on a single core, so failure rates differ from native runs. Both tools reason about happens-before, so they report races even when the run produced a correct result.
5. Check `valgrind --tool=helgrind --help` for optional flags before adding any. `--history-level=full` is the documented default and gives both stacks for a race.

### Output
Saved `/tmp/hg.*.log` and `/tmp/drd.*.log`.

### Quality Gate
- Each log ends with an `ERROR SUMMARY:` line (`grep -c "ERROR SUMMARY" /tmp/hg.*.log` greater than 0).
- The run count for each tool is written down.

---

## Phase 2: Read and Filter Findings

### Entry Criteria
- Logs exist.

### Actions
1. Helgrind race blocks start with `Possible data race during write of size N at 0x... by thread #K` and include `This conflicts with a previous read of size N by thread #J` with both stacks, plus `Locks held: none` or the lock list. Record both in-repo frames.
2. Helgrind lock order blocks start with `Thread #K: lock order "0x... before 0x..." violated` and list where each order was first established. Record both acquisition sites; this is a potential deadlock even if the run did not hang.
3. Helgrind API misuse, for example `Thread #1 unlocked a not-locked lock` or `pthread_cond_wait called with un-held mutex`: record as `pthread API misuse`. These are real bugs regardless of timing.
4. DRD blocks start with `Conflicting store by thread K at 0x...` or `Conflicting load ...` with the other segment's stack. Record both frames.
5. Apply this filter table:

| Finding | Action |
|---|---|
| Both frames in `std::atomic` operations, `std::shared_ptr` reference counts or `std::call_once` internals | Mark as likely false positive: Helgrind and DRD do not model C++11 atomics ordering. Confirm with `race-cpp-tsan` before acting. |
| Frames in a lock-free structure built on `__atomic` builtins | Same as above. |
| Same pair reported by Helgrind and DRD, or also by TSan | Set `confirmed_by_other_tool` = true. |
| `Locks held: none` on one side, a lock on the other | Real missing-lock bug unless both are atomics. |
| Lock order violated | Keep; hand to `race-lock-ordering`. |

6. Never add Valgrind suppression entries (`--suppressions=`) for in-repo frames. Suppressions are for system libraries only, and each needs a comment naming the library.

### Output
`cpp_helgrind_reports`.

### Quality Gate
- Every row cites a line copied from a log (`grep -F "<first line of block>" /tmp/*.log` finds it).
- Every row marked false positive names the filter-table row that applies.

---

## Worked Example

Illustrative only.

`valgrind --tool=helgrind --error-exitcode=1 --log-file=/tmp/hg.%p.log ./build-vg/cache_test --gtest_filter=Cache.ConcurrentPut`

Log excerpt:
```
==7741== Possible data race during write of size 8 at 0x5C3D0A0 by thread #3
==7741== Locks held: none
==7741==    at 0x10A3F2: LruCache::put(int, int) (lru.cpp:58)
==7741== This conflicts with a previous read of size 8 by thread #2
==7741== Locks held: 1, at address 0x5C3D040
==7741==    at 0x10A2B1: LruCache::get(int) (lru.cpp:41)
```

DRD log has `Conflicting store by thread 3 at 0x05c3d0a0 size 8` at `lru.cpp:58`. Row: helgrind + drd confirmed, write `lru.cpp:58` with no lock versus read `lru.cpp:41` holding the cache mutex.

---

## Exit Criteria

DONE when both tools ran on the debug binary, every finding is a row with both sites, and every row is either confirmed, kept, or marked false positive with the matching filter row.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Platform without Valgrind | **Return**: report that this cross-check cannot run; rely on `race-cpp-tsan`. |
| Phase 1 | Run takes too long | **Adjust**: run a single test case with the framework filter (`--gtest_filter`, Catch2 test name) and fewer worker threads in the harness. |
| Phase 2 | Thousands of reports inside the standard library | **Adjust**: rebuild with `-O0` and confirm the program uses `std::mutex` or pthread mutexes that Valgrind intercepts; custom spinlocks are invisible to both tools. |
| Phase 2 | Findings disagree with TSan | **Adjust**: trust TSan for atomics-based code and the Valgrind tools for pthread API misuse; record both. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
