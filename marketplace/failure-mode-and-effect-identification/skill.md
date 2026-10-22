# Failure Mode And Effect Identification

Identify how each maintenance-significant item can fail, what causes each failure, and what happens when it does, using field data where available and engineering analysis where not.

## Inputs

- `functional-breakdown`: System functions with performance standards
- `maintenance-significant-items`: Items to analyze

## Outputs

- `failure-mode-catalog`: For each significant item: failure modes, failure causes, local effects, system effects, and failure evidence (how the operator detects the failure)
- `failure-distribution-data`: Available failure rate or time-to-failure distribution data for each failure mode from field data, vendor data, or handbooks

## Process

1. For each function, ask: how can this function be lost? How can it degrade? A power supply function 'supply 12V' can fail by: output goes to zero (total loss), output drifts high (degradation, overvoltage), output drifts low (degradation, undervoltage), output ripple exceeds limit (degradation). Each is a distinct failure mode requiring a different maintenance approach.
2. Identify failure causes for each mode. Output goes to zero: main switching MOSFET short circuit, control IC failure, input fuse opens due to capacitor degradation, solder joint fracture on power path. Each cause has a different failure pattern (random, wear-out, early-life) that determines whether preventive maintenance is effective.
3. Document the effects at three levels: local (what happens at the component), system (what the operator experiences), and safety (any hazard). A capacitor failure in a power supply filter: local = increased ripple, system = downstream circuits malfunction, safety = none for this example. If the effect were fire risk, the consequence classification changes dramatically.
4. Gather failure data. Best source: field failure records from the same or similar equipment. Second: manufacturer reliability data (MTBF, FIT rates). Third: handbook data (MIL-HDBK-217F, SN 29500, FIDES). Handbook data gives failure rates; field data gives failure distributions (Weibull shape and scale parameters), which are more useful for maintenance planning.
5. Classify each failure mode by its age-reliability pattern. The classic bathtub curve applies only to some failure modes. Electronic components typically show pattern E (constant failure rate) or pattern F (infant mortality decreasing to constant). Mechanical wear items show pattern B (wear-out). This classification determines which maintenance strategies apply.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
