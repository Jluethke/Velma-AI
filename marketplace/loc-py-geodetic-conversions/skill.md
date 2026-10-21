# Python Geodetic Conversions (LLA, ECEF, ENU, NED, UTM)

**One-line description:** Builds and tests a small Python module that converts WGS84 latitude, longitude and height to ECEF, local ENU and NED around a fixed datum, and UTM, using pyproj and pymap3d, with round-trip tests and the ellipsoid versus mean-sea-level height trap handled.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `frame_spec` (object, required): Output of `loc-frame-convention-audit`; gives the world convention.
- `datum_origin` (object, required): Latitude and longitude in degrees and ellipsoidal height in meters of the local tangent plane origin, and the source of that height.
- `project_dir` (string, required): Python project root.

---

## Outputs

- `conversion_module` (string): Path of the Python module with the conversion functions.
- `conversion_test_report` (object): pytest results, round-trip errors, and the cross-check against a second library.

---

## Phase 1: Set Up And Pin Libraries

### Entry Criteria
- Python 3 and pip available in a virtual environment.
- `datum_origin` height is stated as ellipsoidal (WGS84) height.

### Actions
1. `pip install pyproj pymap3d pytest numpy` and record versions with `pip freeze | grep -i -E "pyproj|pymap3d"`.
2. Decide the UTM EPSG code: northern hemisphere `EPSG:326zz`, southern `EPSG:327zz`, where zz is the zone number. Compute the zone with `int((lon + 180) // 6) + 1` and check the documented exceptions (Norway and Svalbard) in the pyproj or UTM references if the area is near them.
3. If the height came from an NMEA GGA sentence, it is altitude above mean sea level. Ellipsoidal height = GGA altitude + GGA geoid separation field. Record which one the input uses; mixing them puts the origin tens of meters off vertically.

### Output
Pinned environment and the chosen EPSG codes.

### Quality Gate
- `python -c "import pyproj, pymap3d; print(pyproj.__version__, pymap3d.__version__)"` prints two versions.
- The UTM EPSG code and the height type are written in the module docstring.

---

## Phase 2: Write The Module

### Entry Criteria
- Phase 1 complete.

### Actions
1. Create `<project_dir>/<pkg>/geodesy.py` with these functions, all taking and returning degrees and meters:
   - `lla_to_ecef(lat, lon, h)` using `pyproj.Transformer.from_crs("EPSG:4979", "EPSG:4978", always_xy=True)`; pass `(lon, lat, h)` because `always_xy=True` means longitude first.
   - `lla_to_enu(lat, lon, h)` using `pymap3d.geodetic2enu(lat, lon, h, lat0, lon0, h0)`.
   - `lla_to_ned(lat, lon, h)` using `pymap3d.geodetic2ned(...)`.
   - `enu_to_lla(e, n, u)` using `pymap3d.enu2geodetic(...)`.
   - `lla_to_utm(lat, lon)` using `Transformer.from_crs("EPSG:4326", "EPSG:326zz", always_xy=True)`.
2. Build each `Transformer` once at module load, not per call; construction is slow.
3. Do not write your own flattening constants. pyproj and pymap3d both carry WGS84.
4. Never compute ENU by subtracting UTM coordinates for headings: UTM grid north differs from true north by the meridian convergence angle. If the filter needs true-north yaw in a UTM frame, compute convergence with `pyproj.Proj(...).get_factors(lon, lat).meridian_convergence` and record it.

### Output
`conversion_module`.

### Quality Gate
- `python -c "from <pkg>.geodesy import lla_to_enu; print(lla_to_enu(lat0, lon0, h0))"` prints values with magnitude below 1e-6 m at the origin.

---

## Phase 3: Test Round Trips And Cross-Check

### Entry Criteria
- Module imports.

### Actions
1. Write `tests/test_geodesy.py` with: origin maps to zero; `enu_to_lla(lla_to_enu(p))` returns `p` for points 1 m, 1 km and 20 km from the origin; ENU to NED equals `(n, e, -u)`.
2. Cross-check ECEF from pyproj against `pymap3d.geodetic2ecef` for the same points and assert agreement to 1e-3 m (a numeric-precision check, not an accuracy claim; adjust only if both libraries document a different tolerance).
3. Run `pytest -q tests/test_geodesy.py` and paste the summary line.
4. Do not delete or loosen a failing assertion. A failure usually means latitude and longitude were swapped.

### Output
`conversion_test_report`.

### Quality Gate
- `pytest -q` prints `N passed` with zero failed.
- Report lists the largest round-trip error at 20 km.

---

## Worked Example

Illustrative. `datum_origin` = 42.3314 N, -83.0458 E, h 140.2 m ellipsoidal. Zone = int((-83.0458+180)//6)+1 = 17, so `EPSG:32617`.

`lla_to_enu(42.3324, -83.0458, 140.2)` returns about `(0.0, 111.0, -0.001)`: 0.001 degree north is about 111 m, and the small negative up is earth curvature. `pytest -q` prints `6 passed in 0.41s`.

---

## Exit Criteria

DONE when the module converts among LLA, ECEF, ENU, NED and UTM, all round-trip tests pass, and the height type is documented.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Height type of `datum_origin` unknown | **Stop**: ask for the GGA geoid separation or receiver ellipsoidal height output. |
| Phase 2 | Results off by thousands of km | **Adjust**: check `always_xy=True` and pass longitude first. |
| Phase 3 | Round-trip error grows with distance | **Adjust**: confirm the same origin height is used both directions. |
| Phase 3 | Libraries disagree beyond tolerance | **Return**: report both values and versions; do not pick one silently. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
