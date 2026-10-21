# Lock And Prefault Memory In C Or C++

**One-line description:** Adds `mlockall(MCL_CURRENT | MCL_FUTURE)`, glibc `mallopt` settings that stop the heap from shrinking or using mmap, and stack and heap prefaulting to a C or C++ control process, then proves zero minor and major page faults during the steady-state loop.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_source_dir` (string, required): Path to the C or C++ source tree, with a working build command and existing tests.
- `stack` (string, required): `c` or `cpp`. Any other value means this flow does not apply.

---

## Outputs

- `memory_lock_patch` (object): The diff applied (file and function names), the build and test commands run with exit codes, `VmLck` read from `/proc/<pid>/status`, and minor and major fault counts sampled twice during steady state with their deltas.

---

## Phase 1: Locate Startup And Loop

### Entry Criteria
- `stack` is `c` or `cpp`.
- The project builds and its tests pass before any change: run the documented build and test commands and record exit codes. If they fail before you start, stop and report.

### Actions
1. Find `main` and the function that starts the control loop: `grep -rn -E 'int main\(|pthread_create|std::thread|std::jthread' <app_source_dir>`.
2. Find existing memory locking: `grep -rn -E 'mlockall|mlock\(|mallopt|MCL_' <app_source_dir>`. If present, review it instead of adding a second copy.
3. Find thread stack settings: `grep -rn pthread_attr_setstacksize <app_source_dir>`.
4. Measure before changing: start the process, wait until it is in the loop, then read `ps -o min_flt,maj_flt -p <pid>` twice 10 seconds apart. Record the deltas.

### Output
Locations for the change and before-change fault deltas.

### Quality Gate
- Build and test exit codes before the change are recorded as 0.
- Before-change `min_flt` and `maj_flt` deltas are recorded.

---

## Phase 2: Add Locking And Prefaulting

### Entry Criteria
- Phase 1 complete. Edit one file (the startup file) in this phase.

### Actions
1. At the start of `main`, before creating threads and before the loop, add in this order:
   ```c
   #include <sys/mman.h>
   #include <malloc.h>
   if (mlockall(MCL_CURRENT | MCL_FUTURE) != 0) { perror("mlockall"); return 1; }
   mallopt(M_TRIM_THRESHOLD, -1);   /* never return freed heap memory to the kernel */
   mallopt(M_MMAP_MAX, 0);          /* never satisfy malloc with a fresh mmap */
   ```
   `mallopt` returns 1 on success and 0 on error; check it. `M_TRIM_THRESHOLD` and `M_MMAP_MAX` are glibc-specific; on musl they do not exist and the heap strategy differs. Record the libc (`ldd --version`).
2. Prefault the heap: allocate the largest amount the program will use at run time (a user-provided figure or measured peak from `/proc/<pid>/status` `VmHWM`), write one byte per page (`sysconf(_SC_PAGESIZE)`), then free it. With trimming disabled the pages stay in the process and stay locked.
3. Prefault the stack of the loop thread: in the loop thread, before the loop, call a function that declares a local array of the thread's stack budget minus a safety amount and writes every page, for example `volatile char buf[N]; for (size_t i = 0; i < N; i += page) buf[i] = 0;`. N must be smaller than the thread's stack size or the thread crashes.
4. Set the loop thread's stack size explicitly with `pthread_attr_setstacksize` so N is known. With `MCL_FUTURE`, new thread stacks are locked as they are mapped.
5. Do not use `MCL_ONFAULT`: it locks pages only when first touched, so the first touch inside the loop still faults.
6. Real-time loops also must not call functions that allocate or fault in new code pages on first call; call each loop function once before entering the periodic loop (warm-up iteration with outputs disabled).

### Output
Patched startup and loop-thread code.

### Quality Gate
- The project builds and the full test suite passes after the change (exit codes 0). Do not remove or weaken a test to make it pass.
- `grep -n mlockall` shows exactly one call, before any thread creation in `main`.

---

## Phase 3: Prove It

### Entry Criteria
- Phase 2 build passes. Granted `memlock` limit (see `rtl-sched-fifo-chrt` Phase 1); without it `mlockall` fails with ENOMEM or EPERM.
- If the process commands actuators: bench or closed course only, behind an independent hardware emergency stop. Otherwise run with actuator outputs disabled.

### Actions
1. Start the process. Read `grep -E 'VmLck|VmRSS' /proc/<pid>/status`. `VmLck` must be nonzero and close to `VmRSS`.
2. After warm-up, sample `ps -o min_flt,maj_flt -p <pid>` (or per thread `ps -L -o tid,min_flt,maj_flt -p <pid>`) twice, 10 seconds apart, while the loop runs.
3. Alternative: `sudo perf stat -e page-faults,major-faults -t <loop tid> -- sleep 10`.
4. Compare with Phase 1 deltas.

### Output
`memory_lock_patch`.

### Quality Gate
- `VmLck` is greater than 0 kB.
- The loop thread's `min_flt` and `maj_flt` deltas over the steady-state window are both 0.

---

## Worked Example

Illustrative. C++ CAN logger and controller, `stack` = `cpp`, built with CMake.

Phase 1: `cmake --build build && ctest --test-dir build` exits 0. Before: loop thread `min_flt` delta 37 over 10 s.

Phase 2: `src/main.cpp` gains the `mlockall` and two `mallopt` calls; `src/loop.cpp` gains a 256 KiB stack prefault in a 512 KiB thread and a warm-up iteration. Build and 42 tests pass.

Phase 3:
```
$ grep -E 'VmLck|VmRSS' /proc/4412/status
VmLck:	   61344 kB
VmRSS:	   61408 kB
$ ps -L -o tid,min_flt,maj_flt -p 4412 | grep 4417; sleep 10; ps -L -o tid,min_flt,maj_flt -p 4412 | grep 4417
 4417   1893      0
 4417   1893      0
```
Delta 0 and 0.

---

## Exit Criteria

DONE when memory is locked, the heap neither shrinks nor mmaps, stacks and heap are prefaulted before the loop, tests pass, and the loop thread shows zero new faults in steady state.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Build or tests fail before any change | **Stop**: report; do not change code on a broken baseline. |
| Phase 2 | Not glibc | **Adjust**: skip `mallopt`, rely on preallocation and pools; record the libc. |
| Phase 3 | `mlockall: Cannot allocate memory` | **Adjust**: raise `memlock` (`LimitMEMLOCK=infinity` or limits.d). |
| Phase 3 | Nonzero fault delta | **Retry**: find the faulting site with `perf record -e page-faults -t <tid>` then `perf report`; prefault or move that allocation before the loop. |
| Phase 3 | Stack prefault crashes | **Adjust**: N exceeds the thread stack size; lower N or raise the stack size. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
