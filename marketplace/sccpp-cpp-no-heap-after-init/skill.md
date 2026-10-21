# C++: No Heap Allocation After Initialization

**One-line description:** Finds hidden heap use in C++ ECU code (std::vector, std::string, std::function, std::shared_ptr, new) and replaces it with fixed-capacity storage or a polymorphic memory resource that cannot fall back to the heap, then proves it with operator new instrumentation and the linked image symbols.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root of the C++ code base.
- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; target ELF and host-test directory.

---

## Outputs

- `cpp_heap_audit` (object): Every allocating construct found (explicit and hidden), its classification (init-time or run-time), the replacement made, the operator new counter results per test, and the allocator symbols in the target image.

---

## Phase 1: Find Explicit and Hidden Allocation

### Entry Criteria
- Host-test build exists.

### Actions
1. Explicit: `grep -rnE "\bnew\b|\bdelete\b|make_unique|make_shared|malloc|calloc" src include`.
2. Hidden (allocating standard types): `grep -rnE "std::(vector|string|function|map|set|unordered_map|unordered_set|list|deque|shared_ptr|any|regex|stringstream|ostringstream)\b" src include`.
3. Image symbols: `arm-none-eabi-nm -C build/target/app.elf | grep -E "operator new|operator delete|malloc"`. With `-C`, demangled names such as `operator new(unsigned int)` are shown.
4. Record the guideline references from `guideline_plan`: MISRA C++:2023 and AUTOSAR C++14 both have rules restricting dynamic memory; cite the rule numbers from the user's copy.

### Output
List of explicit sites, hidden sites and image symbols.

### Quality Gate
- All three searches were run and their outputs saved.

---

## Phase 2: Replace Run-Time Allocation

### Entry Criteria
- Site list exists.

### Actions
1. Classify each site as init-time (constructors of static objects, setup before the main loop or scheduler start) or run-time (anything reachable from a periodic task, ISR or message handler).
2. Replace run-time sites with this table:

| Allocating construct | Replacement |
|---|---|
| `std::vector<T>` with a known maximum | `std::array<T, N>` plus a size counter, or a project fixed-capacity vector class |
| `std::string` | `std::array<char, N>` with explicit length, or `std::string_view` over static storage |
| `std::function` | Function pointer plus context pointer, or a template parameter |
| `std::shared_ptr`, `std::make_unique` | Static object with a lifetime equal to the program |
| Container that must allocate | `std::pmr` container on `std::pmr::monotonic_buffer_resource(buf, sizeof buf, std::pmr::null_memory_resource())` so exhaustion fails instead of falling back to the heap |

3. `N` must come from a requirement or a documented maximum. Record any `N` without a source as an open question.
4. Exhaustion handling: with `-fno-exceptions`, a `null_memory_resource` failure cannot throw usefully, so prefer fixed-capacity types whose insert returns a status the caller checks.
5. Change one class at a time; rebuild and run its tests after each.

### Output
Replaced code with per-change test results.

### Quality Gate
- `ctest --test-dir build/host-test` exits 0 after every change.
- Every `N` cites its source or is an open question.

---

## Phase 3: Instrument and Prove

### Entry Criteria
- Replacements done.

### Actions
1. In a test-only source linked into the host test executable, replace global `operator new(std::size_t)` and `operator delete(void*)` (and the array forms) with versions that increment a counter and call `std::abort()` when a global `g_init_done` flag is true.
2. Set `g_init_done = true` in the test fixture after the system init function returns; run every test.
3. Rerun the `nm` search on the target ELF.
4. Never link the instrumented `operator new` into the target build.

### Output
`cpp_heap_audit`.

### Quality Gate
- Test run with the instrumented allocator exits 0 (no abort).
- `arm-none-eabi-nm -C build/target/app.elf | grep -c "operator new"` prints 0, or every remaining reference is classified init-time with a deviation reference.

---

## Worked Example

Illustrative only. Parking sensor distance filter in C++17.

```
$ grep -rnE "std::(vector|function)" src
src/park_filter.cpp:22:  std::vector<uint16_t> history_;
src/park_filter.cpp:40:  std::function<void(uint16_t)> on_update_;
```

`history_` becomes `std::array<uint16_t, kHistoryLen>` where `kHistoryLen` comes from the filter requirement "median over the last 5 samples". `on_update_` becomes a function pointer plus `void*` context. Instrumented test run: 0 allocations after init. `nm -C` on the target image shows no `operator new`.

---

## Exit Criteria

DONE when no run-time allocating construct remains, the instrumented allocator test passes, and the target image has no allocator symbols outside recorded init-time uses.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Standard library inlines hide allocation from grep | **Adjust**: rely on the Phase 3 counter; it catches allocation regardless of source form. |
| Phase 2 | No maximum size known | **Adjust**: record an open question; keep the dynamic container out of run-time paths until resolved. |
| Phase 3 | Abort occurs inside a third-party library | **Return**: report the library and call stack (`gdb -batch -ex run -ex bt`); replacement is a supplier issue. |
| Phase 3 | Target image still links `operator new` from a static constructor | **Adjust**: confirm the caller is init-time from the map file and record it with a deviation reference. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
