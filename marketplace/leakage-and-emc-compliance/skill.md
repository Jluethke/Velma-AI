# Leakage And Emc Compliance

Verify leakage current limits, design for EMC compliance per IEC 60601-1-2, and verify essential performance is maintained under electromagnetic disturbance.

## Inputs

- `safety-classification`: Applied part types and protection class
- `insulation-design-specification`: Insulation barriers and earth path design
- `device-electrical-architecture`: Circuit topology and signal paths

## Outputs

- `leakage-current-test-results`: Earth leakage, enclosure leakage, and patient leakage current measurements under normal and single-fault conditions
- `emc-test-plan-and-results`: EMC emissions and immunity test results per IEC 60601-1-2 with essential performance verification
- `essential-performance-definition`: Defined essential performance parameters and their acceptance criteria under fault and disturbance conditions

## Process

1. Define essential performance: the clinical function that, if degraded, would create an unacceptable risk. For an infusion pump, essential performance is accurate flow rate. For a monitor, it is accurate physiological measurement. Essential performance must be maintained under single-fault and during electromagnetic disturbance.
2. Measure leakage currents per IEC 60601-1 clause 8.7: earth leakage (normal: 5mA max, single-fault: 10mA), enclosure leakage (normal: 100uA for Type BF, single-fault: 500uA), patient leakage (normal: 10uA for CF, 100uA for BF; single-fault: 50uA for CF, 500uA for BF). Measure in normal condition, open earth, and open neutral.
3. Design for EMC emissions: conducted emissions below IEC 60601-1-2 limits (Group 1 Class A or B depending on intended environment). Radiated emissions below limits. For professional healthcare environment, Class A limits apply. For home healthcare, Class B (more restrictive).
4. Design for EMC immunity per IEC 60601-1-2 Table 9: ESD (6kV contact, 8kV air), radiated immunity (3V/m or 10V/m depending on environment and frequency), EFT (1kV on mains), surge (1kV differential, 2kV common mode), conducted immunity, power frequency magnetic field. At each test, verify essential performance is maintained.
5. Run pre-compliance testing in-house before formal lab testing. Use ESD gun on all accessible surfaces and connections. Use near-field probes to identify emission sources. Fix issues at the design stage: adding ESD protection diodes, improving grounding, adding filtering, and shielding where needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
