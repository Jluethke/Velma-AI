# Forced Response Analysis

Calculate the structural response to applied dynamic loads: harmonic, random, transient, and base excitation.

## Inputs

- `mass-stiffness-model`: Mass and stiffness matrices
- `natural-frequencies-and-modes`: Natural frequencies and mode shapes
- `damping-model`: Damping matrix or modal damping ratios
- `loading-description`: Dynamic load specification

## Outputs

- `response-results`: Displacement, velocity, acceleration, and stress response at critical locations for all load cases
- `critical-locations`: Locations of maximum response with peak values and the modes contributing most
- `design-margins`: Comparison of response to allowable limits including fatigue life estimate if applicable

## Process

1. For harmonic loading: solve in the frequency domain using mode superposition. The response at frequency omega is the sum of modal contributions: q_r(omega) = F_r / (omega_r^2 - omega^2 + 2j*zeta_r*omega_r*omega). This shows resonance amplification at each natural frequency by the factor 1/(2*zeta).
2. For random loading (PSD input): compute the response PSD from S_response(f) = |H(f)|^2 * S_input(f). The RMS response is the square root of the integral of the response PSD. For base excitation with a flat input PSD, Miles equation gives the approximate RMS: a_rms = sqrt(pi/2 * f_n * Q * PSD_input * g^2) where Q = 1/(2*zeta).
3. For transient loading (shock): use direct time integration (Newmark-beta or central difference) or SRS analysis. The shock response spectrum gives the peak response of a SDOF oscillator at each natural frequency to the transient input. Compare equipment natural frequencies to SRS peaks.
4. For base excitation: transform to relative coordinates. The effective force on each mode is the modal participation factor times the base acceleration. Modes with high effective mass in the excitation direction respond most strongly.
5. Identify critical locations where stress or displacement is highest. Check fatigue life if the loading is cyclic: use the stress amplitude at each mode's natural frequency weighted by the number of cycles (from Miner's rule for variable amplitude).
6. Compute design margins: peak response divided by allowable. For shock qualification: margin of safety = (allowable / peak_response) - 1. Positive margin means the design passes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
