# Face Pressure Management

Set and control face pressure during TBM advance to prevent settlement and maintain face stability.

## Inputs

- `tbm-specification`: TBM type and ground conditioning plan
- `ground-model`: Ground conditions with groundwater pressures along alignment

## Outputs

- `face-pressure-regime`: Target face pressure profile along alignment with upper and lower limits and control parameters for each ground zone
- `intervention-protocol`: Procedures for hyperbaric interventions, cutterhead inspection, and tool changes under pressure

## Process

1. Calculate target face pressure for each chainage. Minimum: groundwater pressure plus active earth pressure at tunnel axis (prevents face collapse). Maximum: groundwater pressure plus at-rest earth pressure at crown plus safety margin (prevents blow-out). For shallow tunnels, check blow-out against overburden: face pressure must not exceed total vertical stress at crown minus a safety factor.
2. For EPB: face pressure is controlled by the balance between TBM advance rate (material intake) and screw conveyor extraction rate. Set target earth pressure at the bulkhead sensors. Muck conditioning must produce a paste with low permeability to maintain the pressure gradient across the screw. Monitor screw conveyor torque and discharge rate. If pressure drops: slow extraction, increase advance rate, inject bentonite. If pressure rises: increase extraction rate, reduce advance rate.
3. For slurry shield: face pressure is controlled by the slurry circuit. Pressurized slurry in the excavation chamber supports the face. Maintain slurry level and pressure via feed pump. Slurry density must form a filter cake on permeable ground to transfer pressure to the face. Monitor pressure difference between feed and return lines. Separation plant must maintain slurry density within specification by removing excavated material.
4. Define monitoring requirements. Continuous logging of face pressure, advance rate, screw torque (EPB) or slurry pressure and flow (slurry), grout pressure and volume, tail void grouting volume. Real-time display in TBM cabin with alarm limits. Typical alarm: face pressure deviating more than 0.2 to 0.5 bar from target.
5. Plan interventions. Compressed air interventions for cutterhead inspection and cutter changes. Calculate required intervention pressure from groundwater pressure at invert. Maximum intervention pressure limited by personnel safety (typically 3.5 bar, with saturation diving beyond that). Plan pre-treatment (ground freezing or grouting) for interventions in permeable ground where compressed air losses would be excessive.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
