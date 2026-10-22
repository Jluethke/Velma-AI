# Vco Design And Tuning

Design the voltage-controlled oscillator, selecting between ring and LC topologies based on phase noise, tuning range, and area requirements, then sizing for the target frequency.

## Inputs

- `pll-architecture`: Output frequency range and phase noise requirements
- `process-parameters`: Available inductors, varactors, and transistor models in the process

## Outputs

- `vco-schematic`: Sized VCO circuit with tuning curve
- `vco-phase-noise-estimate`: Phase noise at key offset frequencies from Leeson's model

## Process

1. Choose ring vs LC oscillator. Ring oscillators are compact (no inductors), have wide tuning range (2:1 or more), but have poor phase noise (typically -90 to -100 dBc/Hz at 1 MHz offset for GHz frequencies). LC oscillators have excellent phase noise (-110 to -130 dBc/Hz at 1 MHz) but need inductors (large area) and have limited tuning range (10-30%).
2. For LC VCO: Design the LC tank. The inductor Q dominates phase noise. On-chip spiral inductors in CMOS have Q of 5-15 at GHz frequencies. Use EM simulation to optimize geometry (number of turns, metal width, metal layer). The resonant frequency is f = 1/(2*pi*sqrt(L*C)).
3. Varactor design: MOS varactors (accumulation-mode or inversion-mode) provide the tuning capacitance. Kvco = df/dV depends on the C-V curve slope. Keep Kvco low enough that supply and substrate noise do not push the VCO, but high enough to cover the frequency range. Split the tuning range into coarse (switched capacitor bank) and fine (varactor) segments.
4. Apply Leeson's phase noise model: L(fm) = 10*log10((2*F*k*T / Psig) * (1 + (f0/(2*Q*fm))^2) * (1 + fc/fm)), where F is the noise factor (typically 2-3 for a cross-coupled LC VCO), Q is the loaded tank Q, fm is the offset frequency, and fc is the flicker noise corner.
5. For ring oscillator: phase noise scales as L(fm) = 10*log10((8*k*T*F / (N*Psig)) * (f0/fm)^2), where N is the number of stages. More stages improve phase noise by sqrt(N) but reduce maximum frequency. Minimum 3 stages for reliable oscillation.
6. Verify tuning range covers the PLL output range plus margin for PVT variation (typically 20-30% extra). Ensure the VCO starts up reliably: the negative resistance from the active devices must exceed the tank loss by at least 2x at the worst corner (SS, low supply).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
