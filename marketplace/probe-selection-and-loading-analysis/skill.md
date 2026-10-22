# Probe Selection And Loading Analysis

Select the correct probe type and quantify its loading effect on the circuit under test to avoid measurement artifacts from probe capacitance, resistance, and ground inductance.

## Inputs

- `required-bandwidth`: System bandwidth needed for the measurement
- `measurement-bandwidth-budget`: Cascaded bandwidth budget from scope and probe
- `signal-specification`: Signal characteristics including source impedance and voltage level

## Outputs

- `probe-selection`: Selected probe type (passive 10:1, active, differential, current) with rationale
- `loading-analysis`: Calculated circuit loading from probe input capacitance (typically 8-12pF passive, less than 1pF active) and input resistance
- `ground-lead-artifact-assessment`: Expected ringing frequency from ground lead inductance (f_ring = 1/(2*pi*sqrt(L_lead * C_probe)))

## Process

1. Identify the measurement type: single-ended (passive or active probe), differential (isolated or non-isolated), or current (AC current transformer or Hall effect).
2. For passive 10:1 probes, calculate the input impedance at the signal frequency. At DC it is 10M ohm, but at 100MHz the 10-12pF input capacitance drops impedance to roughly 130 ohm. If source impedance is above 50 ohm, this loads the circuit.
3. For signals above 500MHz or source impedance above 1k ohm, select an active probe (less than 1pF, greater than 100k ohm input) to avoid loading artifacts.
4. Calculate ground lead ringing frequency: a 3-inch ground lead has roughly 60nH inductance. With 12pF probe capacitance, resonance is at approximately 188MHz. Any signal edge faster than about 2ns will excite this resonance.
5. For differential signals (LVDS, CAN, RS-485), select a differential probe rated for the common-mode voltage range. Verify that CMRR at the signal frequency is adequate for the measurement accuracy needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
