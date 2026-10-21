# C and C++ Leak Detection With AddressSanitizer and LeakSanitizer

**One-line description:** Builds with `-fsanitize=address` (or standalone `-fsanitize=leak`), runs the fixed load, triggers LeakSanitizer at exit or at a checkpoint with `__lsan_do_recoverable_leak_check`, and reads the Direct and Indirect leak stacks with proper symbolization and project-scoped suppressions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `leak_brief` (object, required): From `leak-intake-load-recipe`.
- `load_recipe` (object, required): From `leak-intake-load-recipe`.
- `cause_hypotheses` (object[], required): From `leak-classic-causes-triage`. Each Direct leak is matched to a hypothesis id or marked "none".

---

## Outputs

- `lsan_report` (object[]): Each leak with kind (Direct or Indirect), bytes and object count, symbolized allocation stack with file:line, and the count at two checkpoints when recoverable checks were used.

---

## Phase 1: Build With the Sanitizer

### Entry Criteria
- Clang or GCC on Linux x86_64 or aarch64, where LeakSanitizer is supported and on by default with ASan. On macOS and with MSVC, leak detection support differs; check the sanitizer docs for your toolchain before relying on it.

### Actions
1. Compile and link every target with the same flags:
   `-fsanitize=address -fno-omit-frame-pointer -g -O1`
   CMake: `cmake -B build-asan -DCMAKE_BUILD_TYPE=RelWithDebInfo -DCMAKE_C_FLAGS="-fsanitize=address -fno-omit-frame-pointer" -DCMAKE_CXX_FLAGS="-fsanitize=address -fno-omit-frame-pointer" -DCMAKE_EXE_LINKER_FLAGS="-fsanitize=address"`.
2. Leak-only alternative with lower overhead: `-fsanitize=leak` (no ASan memory error checks). Do not combine either with Valgrind or with another allocator preloaded (`LD_PRELOAD` jemalloc or tcmalloc); the sanitizer replaces `malloc`.
3. Rebuild everything, including static libraries you own. Mixed instrumented and uninstrumented code still runs, but allocations inside uninstrumented code may lose stack detail.
4. Make sure a symbolizer is available: `which llvm-symbolizer`. If it is not on `PATH`, set `ASAN_SYMBOLIZER_PATH=/usr/bin/llvm-symbolizer-<ver>`.

### Output
Sanitized build in `build-asan`.

### Quality Gate
- `nm -C build-asan/server | grep -c __asan_init` (or `__lsan_init` for leak-only builds) prints a nonzero count.

---

## Phase 2: Run the Load and Trigger Leak Checks

### Entry Criteria
- Sanitized build exists.

### Actions
1. Set options: `export ASAN_OPTIONS=detect_leaks=1:log_path=asan.log` (for `-fsanitize=leak`, use `LSAN_OPTIONS=log_path=lsan.log`). `log_path` writes `asan.log.<pid>`.
2. For a program that exits: run with the scaled load and let it exit normally. LeakSanitizer runs at exit. It does not run if the process is killed with SIGKILL or calls `_exit`; send SIGINT or SIGTERM and make sure the handler returns from `main`.
3. For a long-running server, add a checkpoint hook on a branch:
   ```cpp
   #include <sanitizer/lsan_interface.h>
   // in a debug-only admin handler:
   int leaked = __lsan_do_recoverable_leak_check(); // prints a report, returns nonzero if leaks found
   ```
   Call it after warmup, after N operations, after 2N operations. Unlike `__lsan_do_leak_check`, the recoverable form can run more than once and does not terminate the process.
4. LeakSanitizer reports only memory with no pointer left to it. Objects still referenced by a growing container are not reported. If memory grows but LSan reports little, continue with `leak-cpp-heaptrack`.

### Output
`asan.log.<pid>` with leak reports.

### Quality Gate
- `grep -E "ERROR: LeakSanitizer|SUMMARY: AddressSanitizer" asan.log.*` prints matches, or prints nothing and the run exited with status 0 (no leaks detected), and that exit status is recorded.

---

## Phase 3: Read Reports and Scope Suppressions

### Entry Criteria
- A report exists, or the clean result is recorded.

### Actions
1. Report shape:
   ```
   ==1234==ERROR: LeakSanitizer: detected memory leaks
   Direct leak of 4096 byte(s) in 32 object(s) allocated from:
       #0 0x... in operator new(unsigned long)
       #1 0x... in Cache::insert(Key const&) src/cache.cpp:77
   Indirect leak of ...
   SUMMARY: AddressSanitizer: 9216 byte(s) leaked in 96 allocation(s).
   ```
2. Direct leak: no pointer to the block anywhere. Indirect leak: reachable only from leaked blocks. Fix Direct first; Indirect usually disappears with it.
3. Take the first frame in your source under the allocator frame as the allocation site.
4. With recoverable checks, compare object counts for the same stack across checkpoints; a count that rises by about N per window is the per-operation leak.
5. Suppress third-party leaks only, in `lsan.supp`:
   `leak:libthirdparty.so` or `leak:ThirdPartyInit`
   and run with `LSAN_OPTIONS=suppressions=lsan.supp:print_suppressions=1`. Never add a suppression that matches a project function or source path.
6. Stacks with `<unknown module>` or raw addresses mean the symbolizer was not found; fix Phase 1 step 4 and rerun before reading.

### Output
`lsan_report`.

### Quality Gate
- Every Direct leak from project code is in the report with file:line.
- `lsan.supp` (if any) has no entry matching a project symbol: `grep -E "<project namespace>|src/" lsan.supp` prints nothing.

---

## Worked Example

Illustrative only.

Input: `teld` daemon, load 200 msg/s (ASan is much faster than Valgrind).

Phase 1: CMake sanitized build; `nm -C build-asan/teld | grep -c __asan_init` prints `2`.

Phase 2: `ASAN_OPTIONS=detect_leaks=1:log_path=asan.log ./build-asan/teld -c test.conf`; admin endpoint calls `__lsan_do_recoverable_leak_check()` at 10,000, 60,000 and 110,000 messages.

Phase 3: checkpoint 2 vs 3:
```
Direct leak of 1200000 byte(s) in 50000 object(s) allocated from:
    #1 0x55d1c2 in Frame::decode(Buffer const&) src/frame.cpp:88
    #2 0x55a0b4 in Session::onMessage(Buffer const&) src/session.cpp:142
```
then `2400000 byte(s) in 100000 object(s)`: one 24-byte `Header` per message. Matches the early return at `session.cpp:150`.

---

## Exit Criteria

DONE when the sanitized build ran the load, leak checks ran at exit or at checkpoints, and every Direct leak in project code is listed with a symbolized allocation site.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Link errors about `__asan_*` symbols | **Retry**: pass `-fsanitize=address` to the link step as well as compile steps. |
| Phase 2 | `LeakSanitizer has encountered a fatal error` or "does not work under ptrace" | **Adjust**: do not run under gdb or strace; on containers add `--cap-add SYS_PTRACE` if the sanitizer docs for your version require it. |
| Phase 2 | No report because process was killed | **Retry**: stop it with SIGINT or SIGTERM and return from `main`, or use the recoverable check. |
| Phase 3 | Memory grows but no leaks reported | **Return**: to `leak-cpp-heaptrack`; the memory is still referenced. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
