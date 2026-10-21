# C++ Geodetic Conversions With GeographicLib

**One-line description:** Builds and tests a C++ conversion library over GeographicLib (`Geocentric`, `LocalCartesian`, `UTMUPS`) that maps WGS84 latitude, longitude and height to ECEF, local ENU and NED, and UTM, with GoogleTest round-trip tests built in CMake.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `frame_spec` (object, required): Output of `loc-frame-convention-audit`; gives the world convention.
- `datum_origin` (object, required): Latitude and longitude in degrees and ellipsoidal height in meters of the local tangent plane origin, and the source of that height.
- `project_dir` (string, required): CMake project root.

---

## Outputs

- `conversion_module` (string): Paths of the header and source implementing the conversions.
- `conversion_test_report` (object): ctest output and round-trip errors.

---

## Phase 1: Add GeographicLib

### Entry Criteria
- CMake and a C++17 compiler available.
- `datum_origin` height is ellipsoidal. If it came from NMEA GGA, add the geoid separation field to the altitude first.

### Actions
1. Install GeographicLib: `sudo apt install libgeographiclib-dev` on Debian or Ubuntu (package name may be `libgeographic-dev` on older releases; check `apt search geographiclib`), or build from source.
2. In `CMakeLists.txt`: `find_package(GeographicLib REQUIRED)` and link `GeographicLib::GeographicLib`. If the installed config exports a different target name, read it from the installed `geographiclib-config.cmake` rather than guessing.
3. Add GoogleTest via `find_package(GTest REQUIRED)` or `FetchContent`, and `enable_testing()`.

### Output
A configuring CMake project.

### Quality Gate
- `cmake -S . -B build` completes with no error and prints the GeographicLib version found.

---

## Phase 2: Write The Wrapper

### Entry Criteria
- Phase 1 complete.

### Actions
1. Create `include/<pkg>/geodesy.hpp` and `src/geodesy.cpp` with a class `Geodesy` constructed from the datum.
2. Hold one `GeographicLib::LocalCartesian lc_{lat0, lon0, h0, GeographicLib::Geocentric::WGS84()};` member. `lc_.Forward(lat, lon, h, x, y, z)` returns ENU (x east, y north, z up). `lc_.Reverse(x, y, z, lat, lon, h)` is the inverse.
3. ECEF: `GeographicLib::Geocentric::WGS84().Forward(lat, lon, h, X, Y, Z)`.
4. NED from ENU: `(n, e, d) = (y, x, -z)`. Write it in one function and call it everywhere; never inline the swap.
5. UTM: `GeographicLib::UTMUPS::Forward(lat, lon, zone, northp, x, y, gamma, k)`; `gamma` is meridian convergence in degrees. Store it if headings are expressed in the UTM grid.
6. Catch `GeographicLib::GeographicErr` at the wrapper boundary and convert it to your project's error type.

### Output
`conversion_module`.

### Quality Gate
- `cmake --build build` completes with zero warnings under `-Wall -Wextra`.

---

## Phase 3: Test

### Entry Criteria
- Library builds.

### Actions
1. Write `tests/geodesy_test.cpp`: origin maps to (0,0,0); Forward then Reverse returns the input for points 1 m, 1 km and 20 km away; ENU to NED swap is correct; UTM zone matches the expected zone for the datum.
2. Use `EXPECT_NEAR` with tolerances that are numeric-precision checks (for example 1e-6 degrees, 1e-3 m) and state that they are not accuracy claims.
3. Build tests with `-fsanitize=address,undefined` in a separate build directory and run `ctest --test-dir build-asan --output-on-failure`.

### Output
`conversion_test_report`.

### Quality Gate
- `ctest` prints `100% tests passed` in both normal and sanitizer builds.

---

## Worked Example

Illustrative. Datum 48.1374 N, 11.5755 E, h 562.0 m.

`Geodesy g(48.1374, 11.5755, 562.0); auto enu = g.toEnu(48.1384, 11.5755, 562.0);` gives about `(0.0, 111.2, -0.001)`. `UTMUPS::Forward` gives zone 32, northp true. `ctest --test-dir build --output-on-failure` prints `100% tests passed, 0 tests failed out of 5`.

---

## Exit Criteria

DONE when the wrapper converts among LLA, ECEF, ENU, NED and UTM and all tests pass in normal and sanitizer builds.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `find_package(GeographicLib)` fails | **Adjust**: set `CMAKE_PREFIX_PATH` to the install prefix, or build GeographicLib from source. |
| Phase 2 | `GeographicErr` thrown on valid input | **Adjust**: check degree inputs are not radians. |
| Phase 3 | Round trip fails only far from origin | **Adjust**: confirm Reverse uses the same `LocalCartesian` instance. |
| Phase 3 | Sanitizer reports an error | **Stop**: fix the reported line; do not drop the sanitizer build. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
