# Adaptive Control Architecture Selection

Determine which adaptive control architecture matches the uncertainty type and performance requirements.

## Inputs

- `plant-model`: Nominal plant model with identified uncertain parameters or unknown structure
- `uncertainty-characterization`: What is uncertain: gain, time constants, order, or complete unknown within a model class

## Outputs

- `adaptive-architecture`: Selected approach (direct MRAC, indirect adaptive, self-tuning regulator, L1 adaptive, or gain scheduling) with structure specification
- `architecture-rationale`: Why this architecture fits the uncertainty type and what guarantees it provides

## Process

1. Classify the uncertainty: if the plant structure is known but parameters vary slowly, direct MRAC or gain scheduling may suffice. If the structure is partially unknown, indirect adaptive (identify then control) is more flexible. If the parameters change rapidly, L1 adaptive provides fast adaptation with bounded transients.
2. Direct MRAC: the controller parameters are adjusted directly to make the closed-loop match a reference model, without explicitly identifying the plant. Applicable when the plant has known relative degree and known sign of the high-frequency gain. Simplest architecture but limited to model-matching problems.
3. Indirect adaptive (certainty equivalence): identify the plant parameters online, then design the controller as if the identified parameters were exact. More flexible than direct MRAC (any control design method can be used with the identified model) but has a separation between identification and control that can cause transient issues.
4. L1 adaptive: separates the adaptation loop (fast parameter estimation) from the control loop (filtered through a low-pass filter that limits the bandwidth of the adaptive signal). This decoupling provides bounded transient response independent of adaptation rate, unlike classical MRAC where fast adaptation can cause high-frequency oscillation.
5. Gain scheduling: if the uncertainty is parameterized by a measurable scheduling variable (operating point, speed, load), design a family of controllers at discrete operating points and interpolate. This is the simplest reliable approach when the scheduling variable is measurable and the plant variation is well-characterized.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
