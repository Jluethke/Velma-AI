# Noise Analysis Methodology

Calculate the input-referred noise of the circuit to verify it meets the noise spec, identifying which devices and which noise mechanisms (thermal, shot, 1/f) dominate.

## Inputs

- `bias-conditions`: Operating points and W/L for all transistors
- `voltage-gain`: Small-signal gain and output resistance
- `performance-spec`: Required input-referred noise spectral density en(f) or integrated noise over bandwidth

## Outputs

- `noise-budget`: Input-referred noise spectral density in nV/sqrt(Hz) at a reference frequency, the 1/f corner frequency, and integrated RMS noise over the signal bandwidth
- `dominant-noise-sources`: Which devices and which noise mechanisms (thermal, 1/f, shot) contribute more than 10 percent of the total input-referred noise

## Process

1. For each MOSFET, the drain current noise spectral density is: thermal component Sid_thermal = 4*kT*gamma*gm where gamma is 2/3 for long-channel and up to 2 for short-channel, and 1/f component Sid_flicker = K/(Cox*W*L*f) where K is the flicker noise coefficient from the process (typically 1e-25 to 1e-24 V^2*F for NMOS, 3 to 5x lower for PMOS).
2. Refer each noise source to the input by dividing by the gain squared from that noise source to the output: vn_input^2 = Sid/gm_input^2 for the input device, and vn_input^2 = Sid_load * (gm_load/gm_input)^2 for load devices. The input pair dominates thermal noise; load devices add 1/f noise that can dominate at low frequencies.
3. Calculate the 1/f corner frequency where thermal noise equals flicker noise: fc = K*gm / (4*kT*gamma*Cox*W*L). To push fc below the signal band, increase W*L of the input pair. Doubling both W and L halves fc but quadruples the input capacitance.
4. For BJT circuits, the base shot noise current spectral density is Sib = 2*q*Ib and collector shot noise is Sic = 2*q*Ic. The input-referred voltage noise is en = sqrt(4*kT*rb + 2*q*Ic/(gm^2)) where rb is the base spreading resistance.
5. Integrate the noise spectral density over the signal bandwidth to get total RMS noise: Vn_rms = sqrt(integral from fL to fH of vn^2(f) df). If 1/f dominates below fc, the integral from fL to fc is vn_1/f^2 * fc * ln(fc/fL). Compare against the spec. If the noise is too high, the design levers are: increase gm of the input pair (more current), increase W*L of input pair (lower 1/f), or switch to PMOS input (lower K).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
