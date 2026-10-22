# Thermal Resistance Decomposition

Decompose the junction-to-ambient thermal resistance into its constituent parts and identify the dominant resistance.

## Inputs

- `package-type`: Package form factor (BGA, QFN, flip-chip, lidded, etc.)
- `die-power`: Total die power and power density (W/cm2)
- `cooling-method`: Airflow velocity or liquid cooling specification

## Outputs

- `thermal-resistance-stack`: Theta values for each layer from junction to ambient: die, TIM1, lid/spreader, TIM2, heat sink, convection
- `dominant-resistance`: The layer contributing the most to total theta_JA, which is the primary optimization target

## Process

1. Calculate die-level spreading resistance. For a concentrated heat source (hot spot) on a silicon die, the spreading resistance from hot spot to die backside depends on hot spot area relative to die area. R_spread = 1/(pi*k*sqrt(A_source)) for a circular source on a semi-infinite plane.
2. TIM1 (between die and lid): R_TIM1 = BLT / (k_TIM * A_die) + 2*R_contact. BLT (bond line thickness) depends on TIM type: thermal grease 25-75um, thermal pad 50-200um, solder 20-50um, sintered silver 20-50um. Contact resistance depends on surface finish and pressure.
3. Heat spreader: R_spreader = t/(k*A) + R_spreading. Copper (k=400 W/mK) or aluminum (k=200 W/mK). Spreading resistance from small die area to larger heat sink interface area. Vapor chamber for high heat flux (eliminates spreading resistance).
4. TIM2 (between lid and heat sink): same calculation as TIM1. Often the dominant resistance in air-cooled systems because of large BLT (50-100um) and lower-conductivity material.
5. Heat sink and convection: R_HS = 1/(h*A_fin). For natural convection h ~ 5-10 W/m2K, forced air h ~ 25-100 W/m2K, liquid cold plate h ~ 1000-10000 W/m2K. Sum all resistances: theta_JA = R_die + R_TIM1 + R_spreader + R_TIM2 + R_HS.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
