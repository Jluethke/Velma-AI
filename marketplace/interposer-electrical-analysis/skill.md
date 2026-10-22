# Interposer Electrical Analysis

Perform signal integrity and power integrity analysis for the interposer, including die-to-die link quality and power delivery.

## Inputs

- `tsv-design`: TSV dimensions and placement
- `rdl-stackup`: RDL routing plan and stackup

## Outputs

- `si-analysis`: Eye diagram quality for die-to-die links: insertion loss, return loss, crosstalk, and timing margin
- `pi-analysis`: Power delivery network impedance profile and IR drop per chiplet

## Process

1. Extract S-parameters for die-to-die signal paths including bump, RDL trace, and bump. Use 2.5D EM extraction tools (Ansys HFSS, Cadence Clarity) or analytical models for initial estimates.
2. Simulate eye diagrams at the target data rate. For UCIe advanced at 16 GT/s, verify that insertion loss is within the PHY equalization capability (typically < 4-6 dB at Nyquist).
3. Analyze crosstalk between adjacent signal lines. Near-end (NEXT) and far-end (FEXT) crosstalk depend on line spacing and coupling length. Verify that aggregate crosstalk is within the noise budget.
4. Build the PDN impedance model: die-level decoupling capacitors, bump inductance, interposer plane capacitance, TSV inductance, and package-level decoupling. Target impedance = V_ripple / I_transient.
5. Simulate PDN impedance vs frequency. Verify that the impedance stays below the target from DC to the highest frequency of interest (typically clock frequency). Identify and mitigate any anti-resonance peaks.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
