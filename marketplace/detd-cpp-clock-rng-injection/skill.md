# C++ Clock and RNG Injection

**One-line description:** Replaces direct `std::chrono` clock reads, `rand()`, `std::random_device` and standard library distributions on the C++ decision path with an injected clock interface and a seeded `std::mt19937_64` whose raw output is mapped by project code, because the standard fixes engine sequences but not distribution algorithms.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root with a CMake build.
- `nondeterminism_sources` (object[], required): Rows from `detd-nondeterminism-inventory` for the cpp stack with `reaches_decision` of yes or unknown.

---

## Outputs

- `injection_patch` (string): Path to `detd_injection.patch` from `git diff`.
- `seam_tests` (string[]): GoogleTest names (for example `Seams.SameSeedSameOutput`) proving the seams.

---

## Phase 1: Define the Seams

### Entry Criteria
- The project builds: `cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON && cmake --build build` exits 0.
- `ctest --test-dir build` runs (record the passed count).

### Actions
1. Add `include/seams/clock.hpp` with an interface: `struct Clock { virtual ~Clock() = default; virtual std::int64_t now_ns() const = 0; };`, a production `SteadyClock` returning `std::chrono::duration_cast<std::chrono::nanoseconds>(std::chrono::steady_clock::now().time_since_epoch()).count()`, and a `FakeClock` with `set(std::int64_t)` and `advance(std::int64_t)`.
2. If virtual dispatch in the control loop is not acceptable, use a template parameter `template <class ClockT>` instead; keep exactly one of the two styles in the project.
3. Use `steady_clock` for durations. `system_clock` can jump backward on time sync; `high_resolution_clock` is an alias whose underlying clock is implementation defined.
4. RNG engine: `std::mt19937_64`. The C++ standard specifies its algorithm and requires the 10000th output of a default constructed `mt19937_64` to equal 9981545732273789042, so every conforming library produces the same sequence for the same seed.
5. Distributions: do NOT use `std::uniform_real_distribution`, `std::uniform_int_distribution` or `std::normal_distribution` on the decision path. Their algorithms are unspecified and differ between libstdc++, libc++ and the MSVC STL, so the same seed gives different values on different toolchains. Write project functions that map raw engine output, for example a double in [0,1) as `(engine() >> 11) * 0x1.0p-53`.
6. Never use `rand()`, `srand()` or `std::random_device` on the decision path. `random_device` may be nondeterministic by design.

### Output
Seam headers.

### Quality Gate
- A unit test asserts `std::mt19937_64 e; e.discard(9999); EXPECT_EQ(e(), 9981545732273789042ULL);` and passes.
- `rg -n '_distribution<' src/` lists no hit on the decision path.

---

## Phase 2: Thread Seams and Fix Container Order

### Entry Criteria
- Seams compile.

### Actions
1. Edit ONE call site per build-and-test cycle: change, `cmake --build build`, `ctest --test-dir build --output-on-failure`. Do not batch many files before building.
2. Pass `const Clock&` and `std::mt19937_64&` into the decision object constructor. Read `now_ns()` once at the top of each step.
3. Replace iteration over `std::unordered_map` or `std::unordered_set` that affects output or float accumulation with `std::map`, or copy keys to a `std::vector`, `std::sort` them, then iterate. Iteration order of unordered containers depends on bucket count, insertion history and the library's hash.
4. Replace containers keyed by pointer (`std::map<Obj*, T>`, `std::set<Obj*>`) with keys on a stable id. Pointer order follows heap addresses, which change with ASLR and allocator state.
5. Record the seed in the recording header (see `detd-boundary-record-schema`).

### Output
Decision path edited.

### Quality Gate
- `ctest` passed count is not lower than the Entry Criteria count.
- No test was removed or disabled: `git diff -- tests/ | rg '^-.*(TEST|EXPECT|ASSERT)'` returns nothing.

---

## Phase 3: Ban and Prove

### Entry Criteria
- Phase 2 tests pass.

### Actions
1. Add a CTest that fails on banned calls in decision sources, for example `add_test(NAME no_direct_clock COMMAND rg -n "steady_clock::now|system_clock::now|\\brand\\(|random_device|_distribution<" ${CMAKE_SOURCE_DIR}/src/decision)` with `set_tests_properties(no_direct_clock PROPERTIES WILL_FAIL TRUE)` (rg exits 1 when nothing matches, so the test passes only when there are no hits). Exclude the seam header's own directory by pointing the command only at decision sources.
2. clang-tidy check `cert-msc51-cpp` warns on predictable seeds. A fixed, recorded seed is intended here; suppress with `// NOLINT(cert-msc51-cpp): seed recorded for replay` on that line only.
3. Add GoogleTest `Seams.SameSeedSameOutput`: two decision objects with the same `FakeClock` and seed, same inputs, outputs compared with `memcmp` over the serialized bytes.
4. Mutation check: add `auto t = std::chrono::steady_clock::now();` in one decision file, run `ctest -R no_direct_clock`, confirm failure, then `git restore` the file.
5. `git diff > detd_injection.patch`.

### Output
`injection_patch`, `seam_tests`.

### Quality Gate
- `ctest -R no_direct_clock` passes on the final tree and failed during the mutation check.
- `ctest -R Seams` passes.

---

## Worked Example

Illustrative only. Source row `src/decision/arbiter.cpp:212 std::uniform_real_distribution<double> jitter(0.0, 1.0);`.

Phase 1: unit test for the 10000th `mt19937_64` output passes on GCC and Clang builds. Phase 2: `jitter(rng)` replaced by `unit_double(rng)` defined as `(rng() >> 11) * 0x1.0p-53`. Phase 3: `ctest -R no_direct_clock` prints `Passed`; with the planted line it prints `***Failed`.

---

## Exit Criteria

DONE when no direct clock, `rand`, `random_device` or standard distribution remains on the decision path, the ban test is live, and the seam tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Build fails before any change | **Stop**: fix the build first; seams on a broken build cannot be tested. |
| Phase 2 | A library uses `unordered_map` internally and its order leaks into outputs | **Adjust**: sort the library's result at the boundary before use. |
| Phase 3 | Ban test passes even with the planted line | **Stop**: the path or the `WILL_FAIL` property is wrong; fix and rerun the mutation check. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
