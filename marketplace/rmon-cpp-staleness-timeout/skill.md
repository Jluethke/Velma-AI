# C++ Staleness and Timeout Checker

**One-line description:** Implements a C++17 staleness, silence and sequence-counter checker on `std::chrono::steady_clock` with an injectable clock, uses unsigned modular arithmetic so counter wraparound is handled without undefined behavior, and tests it deterministically with GoogleTest.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operating_envelope` (object[], required): Output of `rmon-envelope-from-requirements`; rows with numeric `max_age_ms`.
- `repo_dir` (string, required): Monitor repository root (same CMake project as `rmon-cpp-rate-range-check` if both are used).

---

## Outputs

- `cpp_staleness_checker` (object): Paths (`include/monitor/staleness.hpp`, `tests/staleness_test.cpp`), `ctest` summary for plain and sanitizer builds.

---

## Phase 1: Implement

### Entry Criteria
- CMake 3.14 or newer and a C++17 compiler.

### Actions
1. Create `include/monitor/staleness.hpp` (header-only is fine for this size):
   ```cpp
   #pragma once
   #include <chrono>
   #include <cstdint>
   #include <functional>
   #include <optional>
   namespace monitor {
   using Clock = std::function<std::chrono::steady_clock::time_point()>;
   enum class Age { Fresh, Stale };
   enum class Seq { Ok, Repeated, Gap };
   class StalenessChecker {
    public:
     StalenessChecker(std::chrono::nanoseconds max_age, Clock clk = std::chrono::steady_clock::now)
         : max_age_(max_age), clk_(std::move(clk)) {}
     Seq on_message(std::optional<std::uint16_t> seq) {
       last_rx_ = clk_();
       Seq r = Seq::Ok;
       if (seq && last_seq_) {
         const std::uint16_t d = static_cast<std::uint16_t>(*seq - *last_seq_);
         if (d == 0) r = Seq::Repeated; else if (d != 1) r = Seq::Gap;
       }
       last_seq_ = seq;
       return r;
     }
     Age poll() const {
       if (!last_rx_) return Age::Stale;
       return (clk_() - *last_rx_) > max_age_ ? Age::Stale : Age::Fresh;
     }
    private:
     std::chrono::nanoseconds max_age_;
     Clock clk_;
     std::optional<std::chrono::steady_clock::time_point> last_rx_;
     std::optional<std::uint16_t> last_seq_;
   };
   }  // namespace monitor
   ```
2. The `static_cast<std::uint16_t>(a - b)` form is the wrap-safe difference: integer promotion makes `a - b` an `int`, and the cast back reduces it modulo 2^16. Use the counter width from the ICD (4-bit alive counters as in AUTOSAR E2E profiles need a mask `& 0x0F` instead of `uint16_t`).
3. Never use `std::chrono::system_clock` for timeouts; it can jump. `steady_clock::is_steady` is required by the standard to be true.
4. `poll()` must run from a periodic timer (for example a `timerfd` loop, a ROS 2 wall timer, or an RTOS task), not only from the receive callback.

### Output
`include/monitor/staleness.hpp`.

### Quality Gate
- `rg -n "system_clock" include/monitor/staleness.hpp` returns nothing.
- The project builds: `cmake --build build -j` exits 0.

---

## Phase 2: Deterministic Tests

### Entry Criteria
- Header compiles.

### Actions
1. In `tests/staleness_test.cpp`, define a fake clock: a `std::chrono::steady_clock::time_point now{}` variable captured by reference in a lambda passed as `Clock`. Advance it with `now += std::chrono::milliseconds(n)`.
2. Cases: poll before any message is `Stale`; message then advance exactly `max_age` is `Fresh`; advance one more nanosecond is `Stale`; sequence 65535 then 0 is `Ok`; repeated value is `Repeated`; jump by 2 is `Gap`; backward by 1 is `Gap`.
3. Add `add_executable(staleness_test tests/staleness_test.cpp)` and `gtest_discover_tests(staleness_test)` to `CMakeLists.txt`.
4. Run `ctest --test-dir build --output-on-failure`, then the sanitizer build as in `rmon-cpp-rate-range-check` Phase 3.
5. No `std::this_thread::sleep_for` in tests.

### Output
`cpp_staleness_checker`.

### Quality Gate
- Both `ctest` runs print `100% tests passed`.
- `rg -n "sleep_for" tests/staleness_test.cpp` returns nothing.

---

## Worked Example

Illustrative only.
```
$ ctest --test-dir build -R Staleness --output-on-failure
1/7 Test #9:  Staleness.StaleBeforeFirstMessage ....   Passed    0.00 sec
5/7 Test #13: Staleness.CounterWrapIsOk ............   Passed    0.00 sec
100% tests passed, 0 tests failed out of 7
```

---

## Exit Criteria

DONE when staleness, silence, repeat and gap are detected on a steady clock with wrap-safe counter math, and deterministic tests pass in plain and sanitizer builds.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | ICD counter width unknown | **Return**: to the ICD owner; a wrong width turns every wrap into a false trip. |
| Phase 1 | `max_age_ms` open | **Adjust**: skip that signal; keep the open question. |
| Phase 2 | Test passes only with real sleeps | **Stop**: route every clock read through `Clock`. |

**Do not:** subtract signed counters and rely on overflow, use `system_clock`, or detect silence only inside the receive callback.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
