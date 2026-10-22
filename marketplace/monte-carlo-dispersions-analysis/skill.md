# Monte Carlo Dispersions Analysis

Quantify the combined effect of all vehicle and environment uncertainties on mission success through Monte Carlo trajectory simulation.

## Inputs

- `guidance-algorithm`: Guidance algorithm implementation
- `control-law-design`: Control system design
- `navigation-error-budget`: Navigation sensor error models

## Outputs

- `orbit-insertion-statistics`: Mean, standard deviation, and 3-sigma bounds for all orbit parameters at insertion
- `load-statistics`: Statistical max-Q, max-acceleration, and structural loads across all runs
- `mission-success-probability`: Fraction of Monte Carlo runs that achieve the mission success criteria
- `driving-dispersions`: Sensitivity ranking: which uncertainties contribute most to performance variation

## Process

1. Build a 6-DOF trajectory simulation with models for: vehicle mass properties, engine performance (thrust, Isp), aerodynamics, atmosphere (density, wind), IMU errors, engine gimbal dynamics, slosh, and bending. Each model has nominal values and uncertainty distributions.
2. Define the dispersions: engine thrust +/-3%, Isp +/-1%, mass +/-2%, wind (measured profiles plus turbulence model), atmosphere density (range reference atmosphere), IMU errors per sensor specification, CG offset +/- manufacturing tolerance, engine alignment +/- 0.1 degree.
3. Run 2,000-10,000 Monte Carlo trajectories, each with random samples from all dispersions simultaneously. Use Latin Hypercube Sampling for efficiency. Each run produces a full trajectory with orbit parameters at insertion, structural loads, and control activity.
4. Evaluate results: compute statistics for orbit insertion parameters. The 3-sigma orbit insertion error must be within the mission requirement. If not, identify which dispersions drive the error (sensitivity analysis) and either tighten the tolerance, improve the guidance, or add navigation aids.
5. Check structural loads: the 3-sigma max-Q load from dispersions, combined with the structural response, must be within the design load envelope. If dispersions produce loads exceeding the design case, either increase structural capability or add trajectory constraints (load relief autopilot).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
