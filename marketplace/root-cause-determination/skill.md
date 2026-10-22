# Root Cause Determination

Synthesize all evidence into a root cause determination and formulate corrective actions that prevent recurrence.

## Inputs

- `fracture-mechanism`: Microscopic fracture mechanism and origin characterization
- `microstructure-report`: Microstructural condition and any anomalies identified
- `hardness-profile`: Hardness data across the relevant features

## Outputs

- `root-cause-report`: Root cause statement linking the failure mechanism to the material, manufacturing, design, or service condition that caused it, with all supporting evidence cited
- `corrective-actions`: Specific corrective actions addressing the root cause, with verification method for each action

## Process

1. Construct the causal chain from the physical evidence. Example: 'The component failed by fatigue (striations on the fracture surface) initiating from a corrosion pit (EDS shows chloride at the origin) on the inner surface where the coating had been damaged during assembly (witness marks adjacent to the pit). The pit grew to critical size under the service environment (warm salt water) and initiated a fatigue crack that propagated under the cyclic loading until the remaining cross-section could not support the peak load.'
2. Eliminate alternative hypotheses. For each plausible mechanism, check whether the physical evidence supports or contradicts it. Overload requires deformation and dimpled fracture at the origin. Fatigue requires striations. SCC requires intergranular fracture in a susceptible material and environment. Creep requires grain boundary cavitation and service at elevated temperature. If the evidence is ambiguous, state the uncertainty and what additional testing could resolve it.
3. Classify the root cause: design error (inadequate fatigue life, wrong material selection, insufficient corrosion protection), manufacturing defect (machining damage, heat treatment error, welding defect), maintenance error (missed inspection, incorrect repair), or abnormal service condition (overload, overtemperature, corrosive environment not anticipated). The root cause must be actionable: it must point to something that can be changed.
4. Formulate corrective actions tied directly to the root cause. If the root cause is a corrosion pit from coating damage: improve coating protection at the damage-prone area (design), add a handling fixture to prevent assembly damage (manufacturing), and add an inspection point for coating integrity before service (maintenance). Each corrective action must have a verification method (test, inspection, analysis) to confirm it addresses the root cause.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
