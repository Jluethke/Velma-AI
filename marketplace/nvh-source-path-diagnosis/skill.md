# Nvh Source Path Diagnosis

Identify dominant NVH sources and transmission paths using transfer path analysis and operational measurements.

## Inputs

- `nvh-targets`: Quantified NVH targets
- `operating-conditions`: Test conditions
- `frequency-bands-of-concern`: Priority frequency ranges

## Outputs

- `source-path-ranking`: Ranked list of source-path contributions to interior noise and vibration at each operating condition
- `dominant-mechanisms`: Physical mechanisms identified for each dominant source (engine order, gear mesh, tire cavity, aerodynamic)
- `path-transfer-functions`: Measured or FEA-derived transfer functions from each source to the receiver locations

## Process

1. Decompose NVH into source categories: powertrain (engine firing order, accessory drives, transmission gear mesh, driveline), road/tire (tire pattern, tire cavity resonance at ~220 Hz for typical passenger cars, road surface texture), wind (A-pillar vortex, mirror wake, door seal), and body structure (panel radiation from structural vibration).
2. Perform transfer path analysis. Classical TPA: measure operational forces at mount locations (mount stiffness times displacement, or inverse matrix method from acceleration and FRF matrix). Multiply force times transfer function (FRF from force to interior microphone) for each path. Sum all path contributions and compare to measured total. The difference validates the model (synthesis accuracy should be within 3 dB of measurement).
3. For operational TPA (OTPA): measure operational accelerations at all source-side mount points and interior response simultaneously. Use principal component regression or singular value decomposition to estimate path contributions without needing to measure transfer functions separately. Faster but less physical insight than classical TPA.
4. Identify the physical mechanism for each dominant path. Powertrain: engine orders are multiples of half-crank-speed for 4-stroke engines. Gear whine: mesh frequency = number of teeth times shaft RPM. Tire cavity resonance: f = c/(pi*D) where c is sound speed in tire and D is mean diameter, typically near 220 Hz.
5. Rank paths by contribution at each target operating condition and frequency band. The top 3 paths typically account for 80% or more of the total energy. Focus countermeasure design on these paths.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
