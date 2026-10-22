# Qubit Coherence Analysis

Identify and mitigate the dominant decoherence mechanisms to achieve the target T1 and T2 times.

## Inputs

- `qubit-type-and-parameters`: Qubit frequency, junction parameters, and capacitor geometry
- `fabrication-process-recipe`: Materials and processes used
- `readout-resonator-design`: Readout parameters affecting Purcell decay

## Outputs

- `decoherence-budget`: Predicted T1 and T2 from each loss mechanism
- `mitigation-actions`: Design and process changes to suppress dominant loss channels
- `characterization-protocol`: Measurements to diagnose decoherence sources in the fabricated device

## Process

1. Enumerate T1 (energy relaxation) mechanisms. Dielectric loss in substrate surface, metal-substrate interface, and junction oxide: 1/T1_dielectric = omega * p_i * tan_delta_i summed over each interface, where p_i is the participation ratio (fraction of electric field energy in that region). Two-level system (TLS) defects in amorphous oxides are the dominant T1 limit for current transmons. Purcell decay through the readout resonator. Quasiparticle tunneling across the junction.
2. Enumerate T2 (dephasing) mechanisms. Pure dephasing rate 1/T_phi = 1/T2 - 1/(2*T1). For transmons, the dominant dephasing sources are: 1/f flux noise coupling through residual flux sensitivity (suppressed by operating at the flux sweet spot), photon shot noise in the readout resonator (thermal photon number must be < 0.01 at base temperature), charge noise (exponentially suppressed for Ej/Ec > 50). Measure T2_Ramsey and T2_echo to separate low-frequency and high-frequency noise contributions.
3. Calculate the dielectric participation ratios from electromagnetic simulation (HFSS, Sonnet, or Palace). The metal-air surface (native oxide, adsorbates) typically has p ~ 1e-3 with tan_delta ~ 2e-3, limiting T1 to 500 us. The substrate-metal interface has similar contribution. Reducing participation ratios through larger capacitor geometries or cleaner interfaces is the primary design lever.
4. Mitigate dominant losses. Surface treatment: HF etch to remove native oxide before metal deposition, high-vacuum metal deposition (< 1e-8 Torr), in-situ ion mill before second metal layer. Use tantalum or niobium instead of aluminum for capacitor pads (lower surface loss, T1 > 300 us demonstrated). Reduce quasiparticles: phonon traps (normal metal patches), improved shielding from infrared radiation, quasiparticle traps near the junction.
5. Measure and diagnose on the fabricated device. T1 vs frequency (TLS spectroscopy: TLS defects cause frequency-dependent T1 dips). T1 vs temperature (quasiparticle-limited T1 decreases exponentially with temperature above ~150mK). T2_echo vs wait time (identifies slow noise sources). Randomized benchmarking for gate fidelity. Repeated T1 measurements over hours (TLS fluctuations cause T1 to wander).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
