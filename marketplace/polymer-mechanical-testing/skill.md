# Polymer Mechanical Testing

Test mechanical properties (tensile, flexural, impact) of molded specimens according to ASTM or ISO standards.

## Inputs

- `processing-window`: Molding conditions derived from thermal analysis
- `application-requirements`: Mechanical performance targets for the end use

## Outputs

- `mechanical-data`: Tensile modulus, yield strength, elongation at break, flexural modulus, and impact strength
- `stress-strain-curves`: Full stress-strain curves for each specimen set

## Process

1. Mold test specimens (dogbones, bars) at the specified processing conditions
2. Condition specimens at 23C/50% RH for 48 hours per ASTM D618
3. Run tensile (ASTM D638), flexural (ASTM D790), and impact (ASTM D256) tests at n >= 5 per condition
4. Calculate mean, standard deviation, and coefficient of variation for each property

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
