# Factor Of Safety Certification

Apply the factor of safety philosophy and demonstrate structural adequacy for flight certification.

## Inputs

- `buckling-margins`: Buckling margins under all load cases
- `tank-mass-estimate`: Structural mass for weight-strength trade-offs
- `coupled-loads-analysis`: Dynamic load amplification factors

## Outputs

- `structural-certification-package`: Analysis and test evidence package for flight readiness
- `mass-statement`: Final structural mass with margins and reserves
- `life-and-fatigue-assessment`: Structural life in flights for reusable stages, or single-flight adequacy for expendable

## Process

1. Factor of safety approach: Limit load = maximum expected load in service. Ultimate load = limit load x factor of safety (typically 1.25 for manned, 1.40 for unmanned pressure vessels, 1.25 for primary structure in some programs). The structure must not yield at limit load and must not rupture at ultimate load.
2. For mass-critical structures, a lower factor of safety (1.10-1.25) can be justified by: (a) detailed analysis with validated models, (b) extensive testing at the component and full-scale level, (c) rigorous process controls in manufacturing. This is the 'test-verified minimum margin' approach used on Falcon 9.
3. Fatigue and damage tolerance for reusable stages: the structure must survive repeated load cycles (launch + entry + landing). Crack growth analysis per NASGRO or equivalent determines inspection intervals. A detectable crack must not grow to critical size between inspections.
4. Fracture mechanics: assume a flaw exists at the most critical location (usually a weld) with a size equal to the detection limit of the NDE method used. Calculate the stress intensity factor K_I under limit load. If K_I < K_Ic (fracture toughness) at the operating temperature, the structure is safe. For cryogenic tanks, fracture toughness INCREASES with decreasing temperature for most aluminum alloys (a fortunate property).
5. The certification package includes: loads analysis, stress analysis (FEA correlated with test), buckling analysis, fracture mechanics, fatigue life, proof test results, NDE results, material certifications, and process specifications. Each analysis has a signature block for the responsible engineer.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
