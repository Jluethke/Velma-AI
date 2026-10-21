# C: No Dynamic Allocation After Initialization

**One-line description:** Proves a C ECU image performs no heap allocation after initialization by finding every allocation call in source and in the linked binary, replacing run-time allocation with static pools sized at compile time, and trapping any late call with a linker wrap in test builds.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root of the C code base.
- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; the target ELF path and host-test directory.

---

## Outputs

- `c_heap_audit` (object): Every allocation site found in source and every allocator symbol found in the linked image, the classification of each (init-time, run-time, library-internal), the static pool replacements made, and the result of the late-allocation trap test.

---

## Phase 1: Find Every Allocation

### Entry Criteria
- Target ELF exists (or the host-test executable when no target profile exists, recorded as a limitation).

### Actions
1. Search source: `grep -rnE "\b(malloc|calloc|realloc|free|aligned_alloc|strdup|strndup)\s*\(" src include`.
2. Search the linked image for allocator symbols, which also catches library calls (for example `printf` pulling in `_malloc_r` from newlib): `arm-none-eabi-nm -C build/target/app.elf | grep -E " (malloc|calloc|realloc|free|_malloc_r|_free_r|_sbrk)$"`. Use plain `nm` for host binaries.
3. For each symbol found in the image but not in source, find who calls it: `arm-none-eabi-objdump -d build/target/app.elf | grep -B30 "<_malloc_r>" | grep ">:$"` and record the caller function names. Linking with `-Wl,--cref -Wl,-Map=app.map` and reading the cross reference table in `app.map` is the reliable alternative.
4. Record the guidelines: MISRA C:2012 Rule 21.3 (stdlib allocation functions shall not be used) and Directive 4.12 (dynamic memory allocation shall not be used).

### Output
List of source sites and image symbols with callers.

### Quality Gate
- Both the source search and the `nm` search were run and their outputs saved, even when empty.

---

## Phase 2: Classify and Replace

### Entry Criteria
- Allocation list exists.

### Actions
1. Classify each site:

| Site | Class | Action |
|---|---|---|
| Called only from an init function before the scheduler or main loop starts | init-time | If the project's guideline plan disallows all allocation (Dir 4.12 not deviated), replace with static storage; else record with a deviation reference |
| Called from a task, ISR, callback or main loop body | run-time | Replace with a static pool |
| Pulled in by a C library function (`printf`, `strdup`, `fopen`) | library-internal | Replace the library call (for example `printf` with a fixed-buffer formatter that does not allocate) or link a C library build that does not allocate, and confirm with `nm` |

2. Replace a run-time allocation with a fixed array and a free-index pool. The pool size must come from a requirement or a documented maximum (for example "maximum CAN frames buffered = 32 per the communication requirement"). If no source exists, record the size as an open question; do not pick a number.
3. Change one module at a time, rebuild, run its unit tests, then continue.
4. Make exhaustion explicit: the pool allocate function returns a status (`POOL_EXHAUSTED`) the caller must handle; never return NULL silently.

### Output
Replaced code per module with test results.

### Quality Gate
- After each module change, `ctest --test-dir build/host-test` exits 0.
- Each pool size cites its requirement or is listed as an open question.

---

## Phase 3: Trap Late Allocation and Re-verify

### Entry Criteria
- Replacements done.

### Actions
1. In the host-test profile, link with `-Wl,--wrap=malloc -Wl,--wrap=calloc -Wl,--wrap=realloc -Wl,--wrap=free` (GNU ld option) and provide `__wrap_malloc` etc. in a test-only source that calls `__real_malloc` while a global `init_done` flag is false and calls `abort()` once it is true.
2. Run the full unit and integration test suite with the wrap. Any abort names a late allocation; its backtrace (`gdb -batch -ex run -ex bt ./test`) shows the caller.
3. Re-run the `nm` search on the target ELF.
4. The wrap file is test code only. It must not be linked into the target image.

### Output
`c_heap_audit`.

### Quality Gate
- `arm-none-eabi-nm build/target/app.elf | grep -cE " (malloc|_malloc_r|_sbrk)$"` prints 0, or each remaining symbol has an init-time classification and a deviation reference.
- Test suite with the wrap exits 0.

---

## Worked Example

Illustrative only. Diagnostic event logger in an instrument cluster.

```
$ arm-none-eabi-nm build/target/cluster.elf | grep -E " (_malloc_r|_sbrk)$"
08004a1c T _malloc_r
08004f30 T _sbrk
$ grep -n "_malloc_r" build/target/cluster.map | head -2
_malloc_r   .../libc_nano.a(lib_a-svfprintf.o)
```

`snprintf` with `%f` pulled in the allocator. The logger is changed to format integers in fixed point with a project formatter; after rebuild the `nm` search prints nothing, and the wrap test run passes.

---

## Exit Criteria

DONE when no allocator symbol remains in the target image (or each one is init-time with a deviation reference) and the late-allocation trap passes the full test suite.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Target toolchain lacks `nm` with the expected prefix | **Adjust**: use `llvm-nm`, which reads ELF for any target. |
| Phase 2 | No requirement gives a pool size | **Adjust**: record an open question and keep the size as a named constant awaiting the requirement; do not invent it. |
| Phase 2 | RTOS kernel allocates internally (for example dynamic task creation) | **Adjust**: switch to the RTOS's static creation API if it has one (check its documentation) and record the configuration option used. |
| Phase 3 | `--wrap` unsupported by the linker | **Adjust**: provide a test-only `malloc` definition that aborts after init, linked before the C library; record the method. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
