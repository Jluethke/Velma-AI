# Wire Bond Reliability Analysis

Predict wire bond reliability under thermal cycling, wire sweep during molding, and intermetallic growth during high-temperature operation.

## Inputs

- `bonding-recipe`: Optimized bonding parameters
- `process-controls`: Process control parameters

## Outputs

- `reliability-prediction`: Predicted wire bond life under target thermal cycling and operating temperature conditions
- `wire-sweep-analysis`: Predicted wire sweep during molding and verification that it stays within clearance limits

## Process

1. Intermetallic compound (IMC) growth analysis. Au-Al IMC (Au4Al, Au5Al2) grows per Arrhenius: thickness = A * exp(-Ea/kT) * sqrt(t). At 175C, significant Kirkendall voiding occurs in Au-Al bonds after 500-1000 hours. Cu-Al IMC grows slower (higher activation energy).
2. Model wire sweep during molding. Mold compound flows over wires during transfer molding. Wire deflection depends on: flow velocity (gate location, transfer speed), wire span and stiffness (diameter, loop height, arc shape), and mold compound viscosity. Simulate using mold flow analysis.
3. Verify wire sweep clearance: deflected wire must maintain minimum spacing to adjacent wires (typically > 1/2 wire diameter) and to die edge (avoid shorting to die metallization). If sweep exceeds limits: reduce loop height, increase wire diameter, optimize gate location, or reduce transfer speed.
4. Thermal cycling reliability: wire bond heel crack is the typical failure mode. The wire flexes at the heel (stitch bond) due to CTE mismatch between die and substrate. Thicker wire and lower loop reduce heel stress. Predict life from FEA strain analysis and Cu fatigue data.
5. High-temperature storage: verify IMC growth does not degrade bond strength below the 3 gf wire pull minimum after 1000 hours at 150C (per JEDEC JESD22-A103). Cu-Al bonds are more resistant than Au-Al for this failure mode.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
