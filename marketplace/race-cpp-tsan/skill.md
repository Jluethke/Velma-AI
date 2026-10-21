# ThreadSanitizer for C and C++

**One-line description:** Builds the C or C++ stress test with `-fsanitize=thread` in a separate build directory, runs it with TSAN_OPTIONS for complete reports, and reads data race, lock-order-inversion and thread-leak reports into file:line pairs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `stress_command` (string, required): From `race-stress-harness`; a `ctest` or test binary command.

---

## Outputs

- `cpp_tsan_reports` (object[]): One row per distinct report: `kind` (`data race`, `lock-order-inversion (potential deadlock)`, `thread leak`, `heap-use-after-free`, `signal-unsafe call inside of a signal`, `data race on vptr`), `access_a` and `access_b` (read or write, size, file:line, thread id), `mutexes` (mutex ids and creation sites), `summary_line`, `raw_report_file`.

---

## Phase 1: Build With TSan

### Entry Criteria
- Compiler is Clang or GCC on Linux, macOS or FreeBSD (`clang --version` or `gcc --version`). MSVC has no ThreadSanitizer; use WSL or a Linux container.
- The project builds normally.

### Actions
1. Create a separate build directory. Never mix TSan objects with normal objects or with AddressSanitizer objects; `-fsanitize=thread` cannot be combined with `-fsanitize=address` or `-fsanitize=memory`.
2. CMake:
   ```
   cmake -S "<repo_path>" -B build-tsan -DCMAKE_BUILD_TYPE=RelWithDebInfo \
     -DCMAKE_C_FLAGS="-fsanitize=thread -g -O1" \
     -DCMAKE_CXX_FLAGS="-fsanitize=thread -g -O1" \
     -DCMAKE_EXE_LINKER_FLAGS="-fsanitize=thread" \
     -DCMAKE_SHARED_LINKER_FLAGS="-fsanitize=thread"
   cmake --build build-tsan -j
   ```
   Make or plain compiler: add `-fsanitize=thread -g -O1` to both compile and link lines. The Clang ThreadSanitizer documentation recommends `-O1` or higher and `-g` for file and line numbers.
3. Bazel: `bazel test --copt=-fsanitize=thread --linkopt=-fsanitize=thread --copt=-g //path:target`.
4. Every library that touches the shared state must be built with TSan too. Prebuilt libraries without instrumentation cause missed races and false reports. Record any uninstrumented library in the report.
5. Confirm the binary is instrumented: `nm -C build-tsan/<binary> | grep -c __tsan_` prints a number greater than 0.

### Output
Instrumented test binary path.

### Quality Gate
- `nm ... | grep -c __tsan_` is greater than 0.
- The build directory is separate from the normal build (`build-tsan`).

---

## Phase 2: Run With TSAN_OPTIONS

### Entry Criteria
- Instrumented binary exists.

### Actions
1. Run the stress command against the TSan build with these documented runtime flags:
   `TSAN_OPTIONS="halt_on_error=1 second_deadlock_stack=1 history_size=7 log_path=/tmp/tsan" ctest --test-dir build-tsan -R '<name>' --repeat until-fail:<runs> --output-on-failure`
   - `halt_on_error=1`: exit at the first report.
   - `second_deadlock_stack=1`: print both acquisition stacks for lock-order reports.
   - `history_size=7`: maximum per-thread history (range 0 to 7); fixes `[failed to restore the stack]`.
   - `log_path=/tmp/tsan`: write `/tmp/tsan.<pid>`.
   - Check the full list with `TSAN_OPTIONS=help=1 ./binary`.
2. If startup fails with `FATAL: ThreadSanitizer: unexpected memory mapping`, the kernel's mmap randomization exceeds what the installed TSan runtime supports (seen on newer Linux kernels with older LLVM). Fix with a newer compiler, or for the session only: `sudo sysctl vm.mmap_rnd_bits=28`, or run with `setarch $(uname -m) -R <command>` to disable ASLR for that process.
3. Expect slowdown and extra memory; the Clang documentation states typical slowdown of 5x to 15x and memory overhead of 5x to 10x. Raise test timeouts, never drop the sanitizer.
4. TSan exits with code 66 by default when it reported anything (`exitcode` option). Record the exit code.

### Output
Saved TSan log files and exit code.

### Quality Gate
- At least one run used the TSan binary (log or stderr contains `ThreadSanitizer` or the run exited 0 with `nm` confirmation from Phase 1).
- Exit code recorded.

---

## Phase 3: Read Reports

### Entry Criteria
- Logs saved.

### Actions
1. Split logs at `WARNING: ThreadSanitizer:`; each report ends at `SUMMARY: ThreadSanitizer:`.
2. For `data race`, read in this order: `Write of size 4 at 0x... by thread T2:` (access A and its stack), `Previous read of size 4 at 0x... by thread T1:` (access B), optional `Location is global 'g_count' ...` or `Location is heap block of size ...`, `Mutex M12 ... created at:` when listed, and `Thread T2 (tid=..., running) created by main thread at:`.
3. If one access line says `(mutexes: write M12)` and the other has no mutex list, the second path is missing the lock.
4. For `lock-order-inversion (potential deadlock)`: the report lists `Cycle in lock order graph: M1 => M2 => M1` with the stack where each mutex was acquired while holding the other. This fires even if the deadlock never happened in the run. Record the two acquisition sites.
5. For `thread leak`: a thread was neither joined nor detached; record the creation site.
6. For `data race on vptr`: an object is destroyed while another thread calls a virtual method; look for a missing join before destruction.
7. Deduplicate by the pair of in-repo file:line values. Ignore frames in libstdc++ or libc++ headers unless there is no in-repo frame.
8. Suppressions: only for third-party code, in a file `tsan.supp` with lines like `race:third_party_lib_function`, passed with `TSAN_OPTIONS="suppressions=tsan.supp"`. Never suppress an in-repo function to make the run clean.

### Output
`cpp_tsan_reports`.

### Quality Gate
- Every row has a `summary_line` copied from a `SUMMARY: ThreadSanitizer:` line.
- `tsan.supp`, if present, contains no symbol defined in `repo_path` (`rg -n "<symbol>" <repo_path>/src` finds no definition for each suppressed symbol).

---

## Worked Example

Illustrative only.

Build per Phase 1, then `TSAN_OPTIONS="halt_on_error=1 second_deadlock_stack=1" ./build-tsan/queue_stress`.

```
WARNING: ThreadSanitizer: data race (pid=4121)
  Write of size 8 at 0x7b0c00000018 by thread T2:
    #0 RingBuffer::push(int) src/ring.cpp:31 (queue_stress+0x4a1b)
  Previous read of size 8 at 0x7b0c00000018 by thread T1 (mutexes: write M7):
    #0 RingBuffer::pop() src/ring.cpp:44 (queue_stress+0x4b90)
  Mutex M7 (0x7b0c00000000) created at:
    #0 pthread_mutex_lock ...
    #1 RingBuffer::pop() src/ring.cpp:42
SUMMARY: ThreadSanitizer: data race src/ring.cpp:31 in RingBuffer::push(int)
```

Row: kind `data race`, A = write 8 bytes `ring.cpp:31` thread T2 with no mutex, B = read `ring.cpp:44` holding M7. Cause: `push` does not take the mutex that `pop` takes.

---

## Exit Criteria

DONE when the stress test ran on a verified TSan build with the listed options and every report is a row with both accesses, or the run is recorded clean with exit code 0.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Windows with MSVC only | **Adjust**: build in WSL or a Linux container; if impossible, use `race-cpp-helgrind` on Linux or report that no detector can run. |
| Phase 1 | Link errors mixing sanitizers | **Retry**: remove `-fsanitize=address` from the TSan build directory and rebuild clean. |
| Phase 2 | `unexpected memory mapping` | **Adjust**: apply the sysctl or setarch step, then rerun. |
| Phase 3 | Reports only inside an uninstrumented library | **Adjust**: rebuild that library with TSan, or record the report as unconfirmed; do not suppress it silently. |
| Phase 3 | Code uses a custom lock built on raw atomics or assembly | **Adjust**: TSan cannot see its ordering; annotate with the TSan annotations documented in `sanitizer/tsan_interface.h` or replace with `std::mutex` for the test build. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
