# Path Smoothing With Arc-Length Splines

**One-line description:** Turns raw waypoints into a smooth, arc-length parameterized reference path with heading and curvature using SciPy smoothing splines, and rejects any path whose curvature exceeds what the vehicle's maximum road wheel angle can produce.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `waypoints` (string, required): Path to a CSV with columns `x`, `y` in meters in a local planar frame (for example ENU from a survey or a GNSS log converted with pyproj), ordered along the route.
- `control_spec` (object, required): Supplies wheelbase and maximum road wheel angle.

---

## Outputs

- `reference_path` (object): CSV `reference_path.csv` with columns `s`, `x`, `y`, `psi`, `kappa`, `dkappa_ds` at a fixed arc-length step, plus the spline settings and the curvature check result.

---

## Phase 1: Clean Waypoints

### Entry Criteria
- `waypoints` CSV loads and has at least 4 rows (cubic splines need 4 points).

### Actions
1. Load with `numpy.loadtxt(path, delimiter=",", skiprows=1)`.
2. Confirm the frame is planar meters. If coordinates look like latitude and longitude (values within plus or minus 90 and 180), stop and convert with `pyproj.Transformer.from_crs("EPSG:4326", "<local projected EPSG>", always_xy=True)`; the target EPSG is a user choice.
3. Remove consecutive duplicates: drop points whose distance to the previous point is below the minimum spacing the user names (duplicate points make the chord-length parameter non-increasing and break the spline).
4. Compute cumulative chord length `t` with `numpy.cumsum(numpy.hypot(dx, dy))`, prepended with 0.

### Output
Cleaned waypoint array and chord parameter.

### Quality Gate
- `numpy.all(numpy.diff(t) > 0)` prints True.

---

## Phase 2: Fit And Reparameterize

### Entry Criteria
- Chord parameter strictly increasing.

### Actions
1. Choose by input type:

| Waypoint source | Method |
|---|---|
| Surveyed or designed points, exact | `scipy.interpolate.CubicSpline(t, xy, axis=0, bc_type="natural")` (interpolating) |
| GNSS or recorded drive with noise | `scipy.interpolate.make_smoothing_spline(t, x, lam=...)` per axis (SciPy 1.10 or newer), or `scipy.interpolate.splprep([x, y], s=...)` |
| Closed loop track | `CubicSpline(..., bc_type="periodic")` with the first point repeated at the end |

2. Smoothing level (`lam` or `s`) is a user choice. If the user gives the noise standard deviation sigma of the waypoints, start `splprep` with `s = n * sigma^2` (the guideline in the FITPACK and `splprep` documentation) and record it.
3. Resample at a fixed arc-length step `ds` chosen by the user. Compute true arc length by integrating `hypot(x'(t), y'(t))` with `scipy.integrate.cumulative_trapezoid` on a dense grid, then invert `s(t)` with `numpy.interp`.
4. Heading `psi = arctan2(y', x')`, unwrapped with `numpy.unwrap`.
5. Curvature `kappa = (x' y'' - y' x'') / (x'^2 + y'^2)^1.5` using the spline derivatives (`spline(t, 1)`, `spline(t, 2)` for CubicSpline, or `splev(t, tck, der=1)`). Compute `dkappa_ds` by `numpy.gradient(kappa, s)`.

### Output
Resampled path with psi and kappa.

### Quality Gate
- `numpy.max(numpy.abs(numpy.diff(s) - ds))` is printed and decreases when the dense integration grid is doubled (proves the arc-length integration has converged).
- Maximum deviation between the smoothed path and the raw waypoints is printed (meters).

---

## Phase 3: Feasibility Check

### Entry Criteria
- Curvature computed.

### Actions
1. Maximum feasible curvature from the kinematic model: `kappa_max = tan(delta_max) / L`.
2. Find all samples where `abs(kappa) > kappa_max`. List their s ranges.
3. If any exist, report the path as infeasible at those ranges. Do not clip curvature silently; clipping changes the geometry and the vehicle will not track it. Return to the user to move waypoints or increase smoothing.
4. Report `max |dkappa_ds|`; the speed profile flow uses it with the steering rate limit.
5. Write `reference_path.csv` and a plot `reference_path.png` (path plus curvature versus s).

### Output
`reference_path`.

### Quality Gate
- Count of samples with `abs(kappa) > kappa_max` is printed and equals 0, or the flow returns the infeasible ranges.
- `reference_path.csv` has the six columns listed in Outputs.

---

## Worked Example

Illustrative only. 120 GNSS waypoints around a closed course, user sigma 0.05 m, ds 0.25 m, L 2.70 m, delta_max 0.5236 rad.

- Phase 1: 3 duplicates removed at the start line.
- Phase 2: `splprep` with periodic option `per=1`, s = 117 * 0.0025 = 0.29; max deviation 0.11 m.
- Phase 3: kappa_max = tan(0.5236)/2.7 = 0.214 1/m; path max |kappa| 0.081 1/m, so feasible.

---

## Exit Criteria

DONE when `reference_path.csv` exists at fixed ds with heading and curvature, and every sample's curvature is within the vehicle's kinematic limit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Coordinates in degrees | **Adjust**: project to a local metric CRS the user names; rerun. |
| Phase 2 | Spline oscillates between points | **Adjust**: increase smoothing or switch to `splprep`; rerun. |
| Phase 3 | Curvature exceeds kappa_max | **Return**: give the user the s ranges; never clip curvature. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
