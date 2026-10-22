# Tuned Damper Design

Design a tuned mass damper or dynamic absorber to suppress a specific resonance in the structure.

## Inputs

- `natural-frequencies-and-modes`: Natural frequencies and mode shapes of the primary structure
- `response-results`: Response showing which resonance needs suppression
- `structure-properties`: Primary structure mass and stiffness at the attachment point

## Outputs

- `damper-parameters`: Tuned mass damper mass, stiffness, and damping values optimized for target resonance suppression
- `predicted-reduction`: Response comparison with and without TMD showing resonance reduction
- `damper-specification`: Physical design: mass block, spring element, damping element, mounting method

## Process

1. Identify the target resonance: frequency, mode shape, and the response amplitude to suppress. A TMD is effective for a single resonance; multiple resonances require multiple TMDs or a different approach.
2. Select the mass ratio mu = m_TMD / m_effective where m_effective is the modal mass of the target mode at the attachment point. Typical mass ratios: 1-5% for vibration reduction, up to 10% for severe problems. Larger mass ratio gives wider effective bandwidth but costs weight.
3. Apply Den Hartog's optimum tuning: f_TMD / f_target = 1 / (1 + mu) for the frequency ratio. Optimal damping ratio of the TMD: zeta_opt = sqrt(3*mu / (8*(1+mu)^3)). These minimize the maximum response of the combined system.
4. Calculate the predicted response of the 2-DOF system (primary structure + TMD). The original single peak splits into two smaller peaks. The peak reduction depends on mass ratio: 3% mass ratio reduces the peak by roughly 10-12 dB; 5% by roughly 13-15 dB.
5. Design the physical TMD. The mass block must be compact and mountable at a location with significant modal displacement for the target mode. The spring can be a steel leaf, coil spring, or elastomeric element. The damper can be a viscous dashpot, constrained elastomeric layer, or eddy current device. Verify that the TMD's own resonance and stroke are within practical limits.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
