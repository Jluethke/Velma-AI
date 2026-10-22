# Concrete Serviceability Design

Check deflection and crack width under service loads to meet functional and durability requirements.

## Inputs

- `flexural-reinforcement`: As-designed reinforcement at each section
- `load-combinations`: Service-level load combinations

## Outputs

- `deflection-check`: Calculated immediate and long-term deflections vs. allowable (L/240, L/480, etc.)
- `crack-width-check`: Calculated crack width at tension face vs. allowable per exposure class

## Process

1. Calculate immediate deflection. Effective moment of inertia Ie from Branson's equation: Ie = (Mcr/Ma)^3 * Ig + (1-(Mcr/Ma)^3) * Icr, where Mcr = fr*Ig/yt, fr = 7.5*sqrt(f'c) psi. For continuous beams, use weighted average of Ie at midspan and supports.
2. Calculate long-term deflection. Multiply immediate deflection from sustained load by lambda = xi/(1+50*rho'), where xi = 2.0 for 5 years or more, 1.4 for 12 months, 1.0 for 3 months. Compare total deflection to limits: L/240 for floors supporting non-structural elements, L/480 if those elements are likely to be damaged.
3. Check crack width. ACI approach: spacing factor s = 540/fs - 2.5*cc for beams (fs = service steel stress, cc = clear cover). Eurocode approach: wk = sr,max * (epsilon_sm - epsilon_cm), where sr,max = 3.4*c + 0.425*k1*k2*phi/rho_eff. Allowable crack width: 0.3 mm for normal exposure, 0.2 mm for aggressive, per Eurocode 2.
4. For post-tensioned members: verify class U (uncracked), T (transition), or C (cracked) per ACI 318. Class U: tensile stress < 7.5*sqrt(f'c) at service. Class T: between 7.5 and 12*sqrt(f'c). Calculate effective prestress after all losses (elastic shortening, creep, shrinkage, relaxation, friction, anchorage seating).
5. If deflection or crack width is excessive: options are increase section depth, add compression steel (reduces long-term deflection multiplier), increase As (reduces crack spacing), or apply prestressing to counteract dead load deflection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
