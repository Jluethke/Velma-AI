# Insulation Coordination Design

Design the insulation coordination for a high-voltage system: select BIL and BSL ratings, determine clearances, and specify surge protection to protect equipment from lightning and switching surges.

## Inputs

- `system-voltage-class`: Nominal system voltage, maximum operating voltage, and isokeraunic level of the area
- `equipment-catalog`: Available BIL ratings for transformers, bushings, CTs, PTs, and circuit breakers in the voltage class

## Outputs

- `insulation-levels`: Selected BIL and BSL for each piece of equipment, with coordination margins to surge arrester protective levels
- `clearance-requirements`: Phase-to-ground and phase-to-phase clearances per IEEE C2 (NESC) and IEC 60071

## Process

1. Determine the standard insulation level (BIL) for the system voltage class. IEEE C57.12.00 and IEC 60071-1 provide standard BIL values. For 138kV systems: standard BIL is 550 or 650kV. For 230kV: 900 or 1050kV. For 345kV: 1050 or 1300kV. Higher BIL provides more margin but costs more (larger bushings, greater clearances, more insulating material in transformers).
2. Select and apply surge arresters. Metal oxide (ZnO) surge arresters limit transient overvoltages to their protective level. Select the arrester MCOV (maximum continuous operating voltage) above the maximum line-to-ground operating voltage. The arrester protective level (at the switching surge and lightning impulse current levels) must be below the equipment BIL with a protection margin of at least 15-20% for lightning and 15% for switching surges.
3. Calculate the protective margin. PM = (BIL_equipment - V_protective_level_arrester) / V_protective_level_arrester x 100%. If the margin is less than the minimum, either increase the equipment BIL or select a lower-protective-level arrester (lower MCOV). For transformer protection, the arrester must be mounted as close as possible to the transformer terminals; each meter of lead wire adds approximately 1kV to the effective protective level during fast-front transients.
4. Determine clearances. Phase-to-ground clearance depends on the BIL and the altitude (clearances increase above 1000m due to reduced air density). IEEE C2 (NESC) Table 124-1 provides minimum clearances for various BIL levels. Phase-to-phase clearance is typically 1.05-1.15 times the phase-to-ground clearance. Working clearances for personnel must meet NESC Rule 124 or OSHA 1910.269 minimum approach distances.
5. Address switching surge insulation coordination for systems 345kV and above. Switching surges (from breaker operations, line energization, fault clearing) produce overvoltages of 1.5-3.0 per unit. Pre-insertion resistors or controlled switching (synchronized breaker closing near voltage zero) limit switching surges to 1.5-2.0 per unit. The BSL (basic switching surge insulation level) must exceed the maximum switching surge with margin. Arresters also limit switching surges but must be rated for the associated energy duty.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
