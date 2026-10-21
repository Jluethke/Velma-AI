# C++ EKF Implementation With Eigen

**One-line description:** Implements the designed EKF in C++17 with Eigen fixed-size matrices, LDLT solves, Joseph-form update and an innovation log, built in CMake and tested with GoogleTest including a finite-difference Jacobian test and a sanitizer build.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `filter_design` (object, required): Output of `loc-ekf-model-design`.
- `noise_covariances` (object, required): Output of `loc-q-r-derivation`.
- `project_dir` (string, required): CMake project root.

---

## Outputs

- `filter_impl` (string): Paths of the filter header, source and replay executable.
- `filter_unit_tests` (object): ctest results for normal and sanitizer builds.

---

## Phase 1: Filter Core

### Entry Criteria
- Eigen 3 installed: `find_package(Eigen3 3.3 REQUIRED NO_MODULE)` and link `Eigen3::Eigen`.

### Actions
1. Define `constexpr int N = <state size>;` and use `Eigen::Matrix<double, N, 1>` and `Eigen::Matrix<double, N, N>`. Fixed sizes avoid heap allocation in the loop.
2. `predict(double dt)`: x = f(x, dt); F = jacobianF(x, dt); P = F * P * F.transpose() + Q(dt); wrap yaw.
3. `template <int M> double update(const Vec<M>& z, ...)`:
   - `y = residual(z, h(x))` with angle wrap,
   - `S = H * P * H.transpose() + R`,
   - `Eigen::LDLT<MatM> ldlt(S);` check `ldlt.info() == Eigen::Success`,
   - `K = (ldlt.solve(H * P)).transpose()` (P symmetric),
   - x += K * y; Joseph form P = (I - K H) P (I - K H)^T + K R K^T; P = 0.5 * (P + P^T),
   - return `y.dot(ldlt.solve(y))` as the squared Mahalanobis distance and push it to the innovation log.
4. Do not use `.inverse()` on S. Do not use `auto` on Eigen expressions that are stored (`auto K = A * B;` stores an expression template referencing temporaries).
5. Build with `-ffp-contract=off` if results must match a Python reference bit-for-bit closely; fused multiply-add changes rounding.

### Output
`include/<pkg>/ekf.hpp`, `src/ekf.cpp`.

### Quality Gate
- `cmake --build build` completes with zero warnings under `-Wall -Wextra -Wpedantic`.

---

## Phase 2: Tests

### Entry Criteria
- Core builds.

### Actions
1. `JacobianTest`: compare analytic F and each H with central differences (eps 1e-6), `EXPECT_TRUE(analytic.isApprox(numeric, 1e-5))` per column, wrapping angle differences.
2. `CovarianceSPD`: after many random cycles, `Eigen::LLT<MatN>(P).info() == Eigen::Success` and `(P - P.transpose()).norm()` below 1e-12 times `P.norm()`.
3. `WrapTest`: residual of 2*pi - 0.01 becomes -0.01.
4. `SimulatedNEES`: same method as the Python flow with the user's probability; take the chi-square bounds as test constants computed once with `scipy.stats.chi2.ppf` and record the command in a comment (Boost.Math `chi_squared` quantile is an alternative inside C++).
5. Configure a second build with `-fsanitize=address,undefined -g` and run `ctest --test-dir build-asan --output-on-failure`.

### Output
`filter_unit_tests`.

### Quality Gate
- `ctest` prints `100% tests passed` for both build directories.

---

## Phase 3: Replay Executable

### Entry Criteria
- Tests pass.

### Actions
1. Write `ekf_replay` reading a CSV of time-sorted measurements exported from the bag (export with a small `rosbags` script or `rosbag2_cpp::Reader` if ROS 2 is available), and writing `estimate.tum`, `covariance.csv` and `innovations.csv`.
2. Process each measurement at its corrected stamp from `time_offsets`.

### Output
`filter_impl`.

### Quality Gate
- `./build/ekf_replay in.csv out/` writes the three files and `estimate.tum` has 8 columns.

---

## Worked Example

Illustrative. N = 5. `ctest --test-dir build` prints `100% tests passed, 0 tests failed out of 4`. ASan build: same. `./build/ekf_replay meas.csv out/` prints `312801 measurements, 0 LDLT failures`.

---

## Exit Criteria

DONE when the C++ filter passes all tests in normal and sanitizer builds and the replay executable writes estimate, covariance and innovation files.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Eigen alignment assertion at runtime | **Adjust**: use C++17 aligned new or `EIGEN_MAKE_ALIGNED_OPERATOR_NEW` in classes holding fixed-size members. |
| Phase 1 | LDLT reports failure | **Stop**: log the S matrix; check R and P for NaN. |
| Phase 2 | Jacobian test fails | **Adjust**: fix the derivative at the failing index; keep the tolerance. |
| Phase 2 | Sanitizer error | **Stop**: fix it before any replay. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
