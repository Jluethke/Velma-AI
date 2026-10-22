# Analog Noise Analysis

Calculate the input-referred noise of the amplifier from thermal and flicker noise contributions of each transistor, then optimize sizing to meet the noise specification.

## Inputs

- `transistor-dimensions`: Sized schematic with W/L and operating points
- `compensation-network`: Compensation values affecting bandwidth

## Outputs

- `noise-budget`: Input-referred noise spectral density and integrated noise, broken down by transistor contribution
- `noise-optimized-sizes`: Adjusted W/L values if resizing was needed to meet noise spec

## Process

1. Thermal noise of each transistor: Sv = 4*k*T*gamma/gm, where gamma is 2/3 for long-channel and approximately 1-1.5 for short-channel (check process documentation). Flicker noise: Sv = K/(Cox*W*L*f), where K is the flicker noise coefficient (process-dependent, typically 10x worse for NMOS than PMOS in a given process).
2. Input-refer each transistor's noise: multiply by the square of the gain from that transistor's gate to the input. For the input pair, the gain is 1 (their noise appears directly at the input). For cascode devices, the gain is approximately gm_cascode/gm_input, which is typically less than 0.5, so cascodes contribute little.
3. For load transistors (active load or current mirrors), the gain is gm_load/gm_input. Since gm_load is ideally equal to gm_input (for proper gain), load transistors contribute equally to input pair noise. To reduce their contribution, use PMOS loads (lower flicker noise) and increase their L.
4. Integrate the noise spectral density over the bandwidth of interest. For a wideband amplifier, integrate from the flicker noise corner frequency to the unity-gain bandwidth. The flicker corner (where 1/f noise equals thermal noise) is typically 100 kHz to 10 MHz depending on device area.
5. If integrated noise exceeds the spec, increase the input pair W*L product (reduces flicker noise as 1/(W*L)) and increase gm (reduces thermal noise contribution). This costs more current and area. Trade off: doubling W*L reduces flicker noise by 3 dB but doubles input capacitance.
6. Run SPICE noise simulation to verify. Compare the hand calculation to simulation. Discrepancies usually come from short-channel gamma values or neglected noise sources (e.g., bias current source noise injected through finite PSRR).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
