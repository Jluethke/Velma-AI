# Propulsion And Levitation Design

Select and size the propulsion and levitation systems for the target speed and vehicle mass.

## Inputs

- `design-speed`: Maximum operating speed, acceleration, and braking requirements
- `alignment-geometry`: Grades, curves, and station spacing affecting propulsion loads

## Outputs

- `propulsion-specification`: Propulsion technology, power rating, force-speed curve, and wayside/onboard split
- `levitation-specification`: Levitation technology, air gap, weight capacity, guidance system, and power requirements

## Process

1. Decompose drag forces at design speed. Aerodynamic drag: Fd = 0.5 * rho * Cd * A * V^2. In open air at 300 km/h, this dominates. In a tube at reduced pressure (100 Pa), drag drops proportionally but Kantrowitz limit creates choke effects that increase drag if tube diameter is too small relative to pod diameter (blockage ratio). Magnetic drag for maglev: significant at low speed, decreasing with speed. Mechanical drag (rolling resistance if wheel-on-rail): Fr = mu * m * g, where mu approximately 0.002 for steel wheel on rail.
2. Select propulsion technology. Linear induction motor (LIM): simpler, lower cost, lower efficiency at high speed (end effects, large air gap losses). Linear synchronous motor (LSM): higher efficiency (> 90%), precise speed control, but requires powered track (higher infrastructure cost). For very high speed (> 500 km/h): LSM preferred for efficiency. Permanent magnet LSM (PM-LSM) for highest efficiency.
3. Size propulsion. Required thrust at maximum speed equals total drag at that speed plus grade resistance component. Power = thrust * velocity. Acceleration thrust: F = m * a + drag(v) + grade(v), integrated over the speed range from zero to max. Total installed power from the acceleration profile. Wayside power supply sizing: peak power from multiple vehicles accelerating simultaneously, regeneration from braking vehicles.
4. Select levitation technology. Electromagnetic suspension (EMS): attractive force, inherently unstable (requires active gap control at kHz bandwidth), small gap (8-12 mm), works at zero speed (no minimum levitation speed). Electrodynamic suspension (EDS): repulsive force from induced currents, inherently stable but requires minimum speed (5-10 km/h for superconducting magnets), larger gap (100-150 mm), needs wheels for low speed. Passive permanent magnet Halbach arrays: lighter, no power draw, but limited gap and load capacity.
5. Design the guidance system. Lateral guidance from dedicated magnets (separate from levitation) or combined levitation-guidance configuration. For EMS: guidance magnets on side rails. For EDS: null-flux figure-8 coils provide combined lift and guidance. Guidance force must exceed worst-case lateral loads: crosswind on exposed guideway, curve negotiation, switch passing. Backup mechanical guidance (skids) for fault conditions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
