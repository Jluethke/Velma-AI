# C++ Controller Port With Golden Parity

**One-line description:** Ports the simulated controllers to C++17 with Eigen and CMake, without heap allocation in the control step, adds the same state machine and limiter, and proves parity against the Python golden vectors with GoogleTest under sanitizers.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sim_verdict` (string, required): From `ctrl-closed-loop-sim-py`. Must be `PASS`.
- `sim_log` (object, required): Supplies golden vectors and parameters.
- `longitudinal_controller` (object, required): From `ctrl-pid-antiwindup`.
- `pid_gains` (object, required): From `ctrl-pid-step-tuning`.
- `actuator_limiter` (object, required): From `ctrl-actuator-rate-saturation`.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `cpp_controller_build` (object): Path to `controller_cpp/`, the CMake presets used, the release binary path, the GoogleTest report (`ctest --output-junit` file), the parity tolerance and the largest observed difference, compiler version and flags, and the git commit.

---

## Phase 1: Project And Build Settings

### Entry Criteria
- `sim_verdict` is `PASS`.
- `cmake --version` and a C++17 compiler are available.

### Actions
1. Layout: `controller_cpp/CMakeLists.txt`, `include/ctrl/*.hpp`, `src/*.cpp`, `tests/*.cpp`.
2. `find_package(Eigen3 3.3 REQUIRED NO_MODULE)` and link `Eigen3::Eigen`. Fetch GoogleTest with `FetchContent_Declare(googletest URL <release archive>)` and `FetchContent_MakeAvailable(googletest)`; then `include(GoogleTest)` and `gtest_discover_tests(<test target>)`.
3. Flags: `-Wall -Wextra -Werror` for project targets. For numerical parity with Python, add `-ffp-contract=off` (GCC and Clang) so fused multiply-add contraction does not change rounding; never use `-ffast-math`.
4. Two build types: `Release` for the target, and a test build with `-fsanitize=address,undefined -fno-omit-frame-pointer`.
5. Load parameters from a YAML or JSON file at startup (for example `yaml-cpp` or `nlohmann/json`); no parameter is hard-coded in source.

### Output
Configurable CMake project.

### Quality Gate
- `cmake -S controller_cpp -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build` exits 0 with no warnings.

---

## Phase 2: Port

### Entry Criteria
- Project builds.

### Actions
1. Port one module at a time in this order, each with its test before the next: limiter, speed PID, lateral controller selected in the sim, state machine.
2. Use fixed-size Eigen types (`Eigen::Matrix<double, 4, 1>`) and preallocated buffers. No `new`, `std::vector::push_back` or exceptions in `step()`. Allocation happens in constructors.
3. Match Python semantics exactly: `std::atan2`, `std::clamp`, same order of operations in sums (floating-point addition is not associative), same wrapping of angles.
4. NaN handling: `std::isfinite` checks that set the fault flag, matching the Python limiter.
5. Edit one module and its test per step; build and run tests after each.

### Output
`controller_cpp/src` and headers.

### Quality Gate
- After each module, `ctest --test-dir build --output-on-failure` passes for that module's tests.

---

## Phase 3: Parity Under Sanitizers

### Entry Criteria
- All modules ported.

### Actions
1. Convert `golden/*_vectors.npz` to a format C++ reads (for example CSV with `%.17g` or raw little-endian doubles) with a small script kept in `tools/`, outside `controller_cpp/src`.
2. GoogleTest `ParityTest`: feed every recorded input, compare outputs. Tolerance: start at exact equality (`EXPECT_EQ`). If not exactly equal, report the largest absolute and relative difference and the cycle; accept a nonzero tolerance only if the user approves it and it is recorded (difference sources: libm implementation of `atan2` and `tan`).
3. Build the sanitizer configuration: `cmake -S controller_cpp -B build-asan -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -fno-omit-frame-pointer"` then `cmake --build build-asan` and `ctest --test-dir build-asan --output-on-failure`.
4. Export results: `ctest --test-dir build --output-junit ctest_results.xml` (CTest 3.21 or newer).
5. Record `c++ --version`, flags and `git rev-parse HEAD`.

### Output
`cpp_controller_build`.

### Quality Gate
- Release and sanitizer test runs both report 100 percent tests passed.
- Parity max difference printed; it is 0 or within the user-approved recorded tolerance.

---

## Worked Example

Illustrative only. LQR lateral plus speed PID.

- Phase 1: GCC 12.3, `-ffp-contract=off`, build clean.
- Phase 2: four modules, 26 tests.
- Phase 3: ParityTest over 1,000 cycles: speed PID bit-equal; LQR max abs difference 2.2e-16 rad from `atan2`; user approved 1e-12 rad tolerance, recorded. ASan and UBSan runs clean.

---

## Exit Criteria

DONE when the C++ build passes all tests in Release and under ASan and UBSan, and parity with the Python golden vectors is proven and recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Eigen not found | **Adjust**: install the distribution package or set `Eigen3_DIR`; rerun cmake. |
| Phase 3 | Parity drift that grows over cycles | **Stop**: state handling differs (integrator, delay buffer); fix before any tolerance discussion. |
| Phase 3 | Sanitizer report | **Adjust**: fix the reported line; never disable the sanitizer. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
