# Fpga Thermal Verification

Verify that the optimized design operates within thermal limits under worst-case conditions: maximum ambient temperature, maximum activity, and minimum airflow.

## Inputs

- `io-power-changes`: Final I/O configuration changes
- `io-signal-integrity-verification`: Signal integrity confirmation

## Outputs

- `thermal-analysis-report`: Junction temperature estimate under worst-case conditions, thermal margin, and heat sink/airflow requirements
- `power-signoff`: Confirmation that the design meets power and thermal budgets, or documentation of required operating restrictions (reduced ambient, forced airflow)

## Process

1. Calculate worst-case junction temperature: Tj = Ta + (P_total * theta_JA), where Ta is maximum ambient, P_total is the power at maximum activity and voltage, and theta_JA is the junction-to-ambient thermal resistance of the FPGA package with the installed thermal solution.
2. Obtain theta_JA from the FPGA vendor's thermal characterization data for the specific package and thermal solution (bare die, heat sink with no airflow, heat sink with forced airflow). Do not use the generic theta_JA from the datasheet; it assumes specific conditions that may not match the application.
3. If Tj exceeds the maximum junction temperature rating: (a) improve the thermal solution (larger heat sink, increased airflow, thermal interface material), (b) reduce power further (more aggressive clock gating, lower supply voltage if supported), or (c) restrict the operating ambient temperature range.
4. Verify that the power supply can deliver the total current at the required voltage rails. FPGAs have multiple supply rails (VCCINT, VCCAUX, VCCO). Each rail has a current draw from the power analysis. The voltage regulator for each rail must provide this current with margin for transients.
5. Measure actual power consumption on hardware. Compare against the estimate. If the actual power exceeds the estimate by more than 20%, investigate: the toggle rate assumptions may be wrong, or the design may have unexpected switching activity (e.g., bus contention, oscillating logic).
6. Document the thermal analysis in the signoff report: estimated power, thermal solution, junction temperature at worst case, margin to the maximum rating, and any operating restrictions. This document is required for product qualification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
