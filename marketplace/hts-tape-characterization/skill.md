# Hts Tape Characterization

Characterize REBCO HTS tape performance: critical current versus field, angle, and temperature, and mechanical properties.

## Inputs

- `target-application`: Magnet application defining field and temperature requirements
- `candidate-tapes`: REBCO tape manufacturers and grades to evaluate

## Outputs

- `ic-surface-data`: Critical current as function of B, theta, and T for selected tapes
- `mechanical-properties`: Stress-strain, critical strain, and fatigue data for tape and substrate
- `tape-selection`: Selected tape grade with operating margins

## Process

1. Measure Ic(B,theta,T) on short samples in a characterization magnet. REBCO tape Ic is strongly anisotropic: Ic(B parallel to ab-plane) >> Ic(B parallel to c-axis). At 4.2K and 20T with B parallel to c-axis, typical high-performance tape carries 200-400 A/4mm width.
2. Characterize mechanical limits: the REBCO layer is ~1 um on a ~50 um Hastelloy substrate with Cu stabilizer. Irreversible Ic degradation above ~0.4-0.6% strain (manufacturer-dependent). Measure with strain applied at operating temperature.
3. Measure n-value (resistive transition sharpness): V = Vc * (I/Ic)^n. Higher n-value means sharper transition, easier quench detection but less current sharing in a quench. Typical n = 20-40 for REBCO.
4. Assess tape uniformity: Ic varies along tape length (manufacturing variation). Statistical characterization from meter-by-meter Ic data. The minimum Ic determines the coil operating current, so tape variability directly costs performance.
5. Select tape and define operating point: aim for Ic_operating / Ic_min(B_peak, theta_worst, T_operating) = 0.7-0.8. Account for Ic degradation from winding strain and from radiation in fusion application.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
