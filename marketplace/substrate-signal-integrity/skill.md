# Substrate Signal Integrity

Verify signal integrity for high-speed traces routed through the substrate including loss, crosstalk, and via transitions.

## Inputs

- `routing-rules`: Trace dimensions and spacing per layer
- `substrate-stackup`: Material properties and layer thicknesses

## Outputs

- `si-analysis`: Insertion loss, return loss, and crosstalk for critical nets
- `via-transition-design`: Optimized via transitions (anti-pad, back-drill or stub removal) for high-speed signals

## Process

1. Calculate trace loss: conductor loss (skin effect, surface roughness: Hammerstad model) + dielectric loss (loss tangent of substrate material). At 10 GHz, typical ABF substrate loss is 0.8-1.5 dB/cm depending on Df.
2. Design via transitions. A via passing through unused layers creates a stub that resonates at f = c / (4 * L_stub * sqrt(Er)). For a 400um stub in Er=3.3, resonance at ~100 GHz (usually acceptable). For thicker substrates, back-drill or use blind vias.
3. Optimize via anti-pad diameter. Larger anti-pad reduces via capacitance (better return loss) but breaks up the reference plane (worse for adjacent signals). Balance by simulation. Typical anti-pad: 250-350um for 200um drill.
4. Analyze crosstalk for parallel traces. Coupling depends on spacing, trace height above reference plane, and coupling length. For stripline in substrate, 3x line-width spacing gives < -40 dB crosstalk typically.
5. Simulate critical paths end-to-end: die bump to substrate trace to BGA ball. Include package model in channel simulation. Verify that the total channel (TX die to package to board to package to RX die) meets the eye mask or BER target.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
