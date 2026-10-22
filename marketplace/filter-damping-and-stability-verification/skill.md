# Filter Damping And Stability Verification

Add damping to prevent filter resonance from amplifying noise, verify the complete filter meets the emission standard with margin, and finalize the filter design.

## Inputs

- `parasitic-model`: Component parasitic models for realistic simulation
- `high-frequency-mitigation`: Additional high-frequency components selected

## Outputs

- `damped-filter-design`: Complete filter schematic with damping networks, all component values and ratings, thermal dissipation in damping resistors
- `compliance-prediction`: Predicted emission spectrum with filter installed, showing margin to limits at all critical frequencies and across the full 150kHz-30MHz band

## Process

1. Check filter Q at resonance. An undamped LC filter has a resonant peak of +20*log10(Q) dB, where Q = 1/(2*pi*f0*C*ESR) for the DM stage. If Q > 10, the filter amplifies noise at its resonance by > 20dB. This is worse than no filter at that frequency.
2. Add damping. Method 1: parallel damping: Rd in series with Cd across the filter capacitor. Rd = sqrt(L/C) for critical damping. Cd should be 4-10x the filter cap to not significantly change the filter corner frequency. Dissipation: Pd = Iac^2 * Rd at the resonance frequency.
3. Method 2: series damping (lossy inductor): use a powdered iron core inductor instead of ferrite, where the core loss provides natural damping at the resonance frequency. The loss tangent of powdered iron increases with frequency, providing frequency-dependent damping.
4. Verify Middlebrook stability criterion. The magnitude of the filter output impedance (including the resonance peak) must be less than the magnitude of the converter input impedance at all frequencies: |Zf_out(jw)| < |Zin_conv(jw)|. The converter input impedance for a regulated converter is Zin = -Vin^2/Pin (negative resistance). Use the damped filter impedance including the damping resistor.
5. Compile the complete filter BOM: all components with voltage ratings, current ratings, temperature ratings, and safety certifications (X/Y capacitor safety agency marks, CM choke UL/VDE approval). Predict final emissions with the filter using either simulation (SPICE with parasitic models) or calculation, showing 6dB margin to limits at all frequencies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
