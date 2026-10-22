# Wind Turbine Structural Loads

Calculate the structural loads on the wind turbine from design load cases per IEC 61400 and verify structural integrity of the tower, blades, and drivetrain.

## Inputs

- `rotor-design`: Blade geometry and aerodynamic properties
- `power-curve`: Operating parameters vs wind speed

## Outputs

- `design-load-envelope`: Ultimate and fatigue loads at key cross-sections (blade root, hub, tower top, tower base) from the governing DLCs
- `structural-verification`: Material utilization ratios for blades, tower, and foundation interface loads, with factors of safety

## Process

1. Define the design load cases (DLCs) per IEC 61400-1. The critical cases typically include: DLC 1.3 (power production with extreme turbulence), DLC 1.6 (power production with extreme coherent gust with direction change), DLC 2.3 (fault during operation with external grid loss), DLC 6.1 (parked, extreme wind with yaw misalignment), and DLC 1.2 (fatigue during normal power production).
2. Run aeroelastic simulations. Tools like OpenFAST, Bladed, or HAWC2 model the coupled aerodynamic, structural, and control system response. Each DLC requires multiple simulations with different turbulence seeds (6 seeds minimum per IEC 61400-1 for ultimate loads). Extract time series of forces and moments at key cross-sections.
3. Process ultimate loads. For each cross-section, identify the maximum and minimum values of each load component (Mx, My, Mz, Fx, Fy, Fz) across all DLC simulations. Apply the partial safety factor for loads (typically 1.35 for normal conditions). Compare against the cross-section capacity with a material partial safety factor (1.1-1.3 depending on material and failure mode).
4. Process fatigue loads. Extract load cycles using rainflow counting from the time series weighted by the annual wind speed distribution. Calculate the damage equivalent load (DEL) at each cross-section for a reference number of cycles (typically 1E7 for 20-year life). Compare the DEL against the material S-N curve (Goodman diagram for mean stress correction) to verify that the accumulated fatigue damage is less than 1.0.
5. Derive the foundation interface loads. The tower base loads (overturning moment, vertical force, horizontal shear, torsion) define the foundation design input. For onshore, the overturning moment at the tower base under DLC 6.1 (extreme wind, parked) typically governs the foundation size. Provide the full load envelope (ultimate and fatigue) to the foundation designer.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
