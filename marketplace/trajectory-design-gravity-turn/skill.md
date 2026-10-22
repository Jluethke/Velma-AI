# Trajectory Design Gravity Turn

Design the ascent trajectory from vertical launch through gravity turn to orbit insertion, managing aerodynamic loads and performance.

## Inputs

- `stage-count`: Number of stages and their delta-v allocations
- `stage-mass-estimates`: Mass breakdown per stage
- `target-orbit`: Target orbit parameters

## Outputs

- `pitch-program`: Pitch angle vs time or altitude profile for the gravity turn
- `max-q-conditions`: Maximum dynamic pressure: altitude, velocity, Mach number, and load in Pa
- `staging-conditions`: Altitude, velocity, and flight path angle at each staging event
- `orbit-insertion-accuracy`: Predicted insertion error ellipse from guidance dispersions

## Process

1. Launch vertical to clear the tower, then initiate the pitch maneuver (typically 1-5 degrees at T+10-15 seconds). The initial pitch kick sets the gravity turn trajectory; after that, gravity bends the trajectory toward horizontal.
2. The gravity turn is a zero-lift trajectory in the pitch plane where the thrust vector follows the velocity vector. This minimizes steering losses but requires the initial conditions to produce an acceptable trajectory. Iterate the pitch kick angle and timing.
3. Monitor max-Q (dynamic pressure = 0.5 * rho * v^2). For most launchers this peaks at Mach 1-2 at 10-15 km altitude, typically 20-40 kPa. The structural design case is max-Q combined with gust loads. Throttle-down at max-Q reduces loads but increases gravity loss.
4. For non-equatorial orbits from a non-matching launch site latitude, a dog-leg maneuver changes the azimuth during ascent. This is costly in delta-v; a 20-degree plane change at 6 km/s costs roughly 2,000 m/s. Launching near the target inclination avoids this.
5. Upper stage guidance uses powered explicit guidance (PEG) or iterative guidance mode (IGM) to compute the remaining thrust direction and cutoff time for precise orbit insertion. These algorithms handle vehicle dispersions and off-nominal performance in real time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
