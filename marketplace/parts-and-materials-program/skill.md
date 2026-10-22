# Parts And Materials Program

Establish the parts and materials program: define part grades, selection criteria, radiation screening, derating policy, and approved parts list management.

## Inputs

- `mission-class`: Mission risk classification (Class A/B/C/D per NPR 8705.4 or equivalent), mission duration, radiation environment
- `budget-and-schedule-constraints`: Available budget for parts procurement and screening, schedule for parts qualification

## Outputs

- `parts-program-plan`: Parts grade requirements, approved parts list, screening and derating policy, radiation lot acceptance test plan
- `materials-and-processes-requirements`: Approved materials list, outgassing requirements, restricted materials, process specifications

## Process

1. Define part grades by mission class. Class A/B missions (high-value, long-life): MIL-PRF-38535 Class V (space-grade) or Class Q (qualified). These parts have full traceability, radiation characterization, and screening (100% burn-in, particle impact noise detection, DPA of sample lots). Class C/D missions: commercial parts with screening (up-screening) may be acceptable with added risk.
2. Establish the derating policy. Derate all parts below their rated values to increase reliability. Per EEE-INST-002 or equivalent: semiconductors derated to 70-80% of rated voltage, resistors to 50-60% of rated power, capacitors to 60-70% of rated voltage. Derating reduces failure rate by lowering stress on the part and provides margin for end-of-life degradation.
3. Define the radiation lot acceptance test (RLAT) program. For parts without radiation data, or for new lots of previously characterized parts, test a sample to the mission TID level (with 2x margin). Perform Co-60 irradiation at both high and low dose rates (ELDRS testing for bipolar devices at 10 mrad(Si)/s). Define pass/fail criteria based on parametric shifts vs datasheet limits.
4. Establish the approved materials list. All materials in the flight build must pass outgassing per ASTM E595 (TML < 1.0%, CVCM < 0.10%). Restricted materials include cadmium (whiskering), zinc (sublimation in vacuum), tin (whiskering unless mitigated), and PVC (outgassing, radiation degradation). Define process specifications for soldering (J-STD-001 with Space Addendum), crimping, conformal coating, bonding, and cable harnessing.
5. Manage the approved parts list (APL). Each part on the APL has a qualified manufacturer, part number, grade, radiation tolerance, and derating status. Parts not on the APL require a nonstandard part approval request (NSPAR) documenting the rationale, risk assessment, and any additional screening or testing required. Track part obsolescence and maintain a last-time-buy strategy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
