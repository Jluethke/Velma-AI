# Remove Heap Allocation From A C++ Control Loop

**One-line description:** Finds every heap allocation that happens inside a C++ real-time loop iteration (including hidden ones in std::function, std::string, containers, exceptions, iostreams and logging), replaces each with preallocated storage, and proves zero allocations per iteration with a test-build allocation counter and a bpftrace malloc probe.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_source_dir` (string, required): C++ source tree with build and test commands.
- `memory_lock_patch` (object, required): From `rtl-c-mlockall-prefault`. Memory locking is in place; this flow removes the remaining run-time allocations.

---

## Outputs

- `alloc_audit` (object): Allocation sites found in the loop with file, line and type; the replacement used for each; the per-iteration allocation count before and after from the counter; the bpftrace result; build and test exit codes.

---

## Phase 1: Count Allocations Per Iteration

### Entry Criteria
- Build and tests pass (record exit codes).

### Actions
1. Add a test-only translation unit (compiled only into a test or diagnostic build target, never into production) that replaces the global allocation functions and counts calls on a flagged thread:
   ```cpp
   #include <atomic>
   #include <cstdlib>
   #include <new>
   thread_local bool g_in_rt_loop = false;
   std::atomic<unsigned long> g_rt_allocs{0};
   void* operator new(std::size_t n) {
     if (g_in_rt_loop) g_rt_allocs.fetch_add(1, std::memory_order_relaxed);
     if (void* p = std::malloc(n ? n : 1)) return p;
     throw std::bad_alloc();
   }
   void operator delete(void* p) noexcept { std::free(p); }
   void operator delete(void* p, std::size_t) noexcept { std::free(p); }
   ```
   Also replace `operator new[]`, `operator delete[]` and the aligned (`std::align_val_t`) forms the same way if the code uses them.
2. In the loop body (diagnostic build), set `g_in_rt_loop = true` at iteration start and false at the end. Run a fixed number of iterations in a test, then assert `g_rt_allocs == 0`. Record the count before any fix.
3. This counter misses direct `malloc` calls from C libraries. Also run a probe on the real binary: `sudo bpftrace -e 'uprobe:<path to libc.so.6>:malloc /tid == <loop tid>/ { @[ustack] = count(); }'` for 10 seconds during steady state, then Ctrl-C. Find the libc path with `ldd <binary> | grep libc`. Each printed stack is an allocation site.

### Output
Before counts and allocation stacks.

### Quality Gate
- The counter value for N iterations and the bpftrace stack list are saved.

---

## Phase 2: Replace Each Allocation

### Entry Criteria
- At least one allocation found. If zero by both methods, go to Phase 3.

### Actions
1. Fix one site at a time; rebuild and rerun the counter after each. Do not batch-edit many files at once.
2. Use this table:

| Site | Replacement |
|---|---|
| `std::vector::push_back`/`emplace_back` growing | `reserve(max)` before the loop; check `size() < capacity()` and handle full explicitly; or `std::array` with a count |
| `std::string` building, `std::to_string`, `std::ostringstream`, `std::format` | Fixed `char` buffer with `std::to_chars` or `snprintf` into it |
| `std::function` holding a large capture | Template parameter, function pointer plus context, or a fixed-capacity callable type |
| `std::map`/`std::unordered_map` insert | Build before the loop; in the loop only `find`; or a fixed array indexed by id |
| `std::make_shared`/`new` per message | Object pool allocated before the loop |
| `throw` | Exception objects are allocated (`__cxa_allocate_exception`); return error codes in the loop |
| Logging library call | Write a fixed-size record into a preallocated single-producer single-consumer ring buffer; a non-RT thread formats and writes it |
| Temporary containers in a function called per iteration | `std::pmr::monotonic_buffer_resource` over a preallocated buffer with `std::pmr::null_memory_resource()` upstream, reset once per iteration with `release()`; overflow throws `std::bad_alloc` in tests instead of silently allocating |

3. Do not wrap the loop in a try/catch that hides `bad_alloc` from the pmr resource; that would hide the defect the test is meant to find.

### Output
Patched loop code, one site at a time.

### Quality Gate
- After each site fix, the build and full test suite exit 0 and the counter value went down.

---

## Phase 3: Prove Zero

### Entry Criteria
- All sites addressed.
- If the binary commands actuators when run: bench or closed course only, with an independent hardware emergency stop; otherwise actuator outputs disabled.

### Actions
1. Diagnostic test: run the loop for the same N iterations; assert `g_rt_allocs == 0`.
2. Real binary: rerun the bpftrace probe for the same window; it must print no stacks for the loop thread. Also probe `calloc`, `realloc` and `posix_memalign` the same way if the code base uses them.
3. Make the counter test part of the regular test suite so a future change that allocates fails CI.

### Output
`alloc_audit`.

### Quality Gate
- Counter test passes with 0 allocations over N iterations; N is stated.
- bpftrace run prints no `@[...]` entries for the loop thread over a stated window.

---

## Worked Example

Illustrative. Steering-angle filter loop at 1 kHz on a bench rig.

Phase 1: counter shows 3000 allocations over 1000 iterations. bpftrace stacks show `std::vector<CanFrame>::_M_realloc_insert`, `std::__cxx11::basic_string::_M_mutate` (from a debug log line), and `std::_Function_base` (a lambda with a 48-byte capture).

Phase 2: `frames.reserve(64)` before the loop with an explicit full check; log line moved to an SPSC ring of fixed 64-byte records; lambda replaced by a template functor. Counter after each fix: 2000, 1000, 0.

Phase 3:
```
$ ctest --test-dir build -R rt_no_alloc
1/1 Test #17: rt_no_alloc ......................   Passed    0.41 sec
$ sudo bpftrace -e 'uprobe:/lib/x86_64-linux-gnu/libc.so.6:malloc /tid == 5521/ { @[ustack] = count(); }'
Attaching 1 probe...
^C
```
No stacks printed.

---

## Exit Criteria

DONE when both the counter test and the bpftrace probe show zero allocations from the loop thread, every fix kept the tests passing, and the counter test is in the suite.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Replacing `operator new` conflicts with a sanitizer or allocator library | **Adjust**: build the counter target without the sanitizer; use bpftrace only for the real build. |
| Phase 1 | bpftrace not installed or lacks permission | **Adjust**: install `bpftrace` and run as root; or use `ltrace -T -e malloc -p <pid>` with care (it slows the process). |
| Phase 2 | Third-party library allocates internally | **Return**: report the call; move it out of the loop or ask the user to choose a different library. |
| Phase 3 | Tests fail after a fix | **Retry**: revert that one fix and redo it; never delete or weaken a test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
