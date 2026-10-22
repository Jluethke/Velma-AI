# Single Event Effects Analysis

Analyze single-event effects from the particle spectrum and device cross-sections.

## Inputs

- `radiation_environment`: Heavy-ion and proton spectrum driving single events.
- `parts_list`: Devices with their single-event sensitivity data.

## Outputs

- `see_rate`: Predicted single-event upset and latch-up rates.
- `sensitive_parts`: Parts with destructive or high-rate susceptibility.
- `mitigation_needs`: Where error correction or protection is required.

## Process

1. Build the linear-energy-transfer spectrum from galactic cosmic rays, heavy ions, and protons for the orbit and solar condition.
2. Characterize each device by its cross-section versus linear-energy-transfer curve and its threshold, typically fit as a Weibull curve.
3. Estimate the upset rate as the integral of cross-section over the particle flux above threshold, following a standard rate-prediction method.
4. Flag destructive effects: single-event latch-up and gate rupture must be prevented, not merely corrected, through part selection or current limiting.
5. Set mitigation: error detection and correction on memory, triple-redundancy or voting on critical logic, watchdog timers, and latch-up current protection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
