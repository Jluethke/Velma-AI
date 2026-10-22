# Pa Stability Linearity Verification

Verify PA stability across frequency and temperature, and characterize linearity to determine if linearization is needed.

## Inputs

- `pa-matching-networks`: Completed matching networks
- `pa-bias-circuit`: Bias design
- `pa-requirements`: Linearity requirements (EVM, ACPR, spectral mask)

## Outputs

- `pa-stability-analysis`: K-factor and mu-factor across frequency from DC to well above the operating band, with stability circles at any conditionally stable frequencies
- `pa-linearity-characterization`: AM-AM (gain compression), AM-PM (phase distortion), two-tone IMD (IP3), ACPR with modulated signal, and EVM measurement results

## Process

1. Check small-signal stability: calculate the Rollett K-factor and |delta| (or mu-factor) from the S-parameters of the complete PA (transistor plus matching networks) at all frequencies from DC to at least 5 * f_operating. K > 1 and |delta| < 1 at all frequencies = unconditionally stable.
2. Check for low-frequency oscillation: bias networks can create feedback paths at low frequencies. Verify that the bias network provides low impedance (good bypassing) at all frequencies, not just at the operating frequency.
3. Measure AM-AM compression: sweep the input power and plot gain versus input power. The 1-dB compression point (P1dB) and saturation power (Psat) define the linear and saturated operating range. For linear operation, back off from P1dB by the PAPR of the signal plus some margin.
4. Measure AM-PM: plot the output phase shift as a function of input power. AM-PM conversion causes spectral regrowth in wideband signals. A well-designed PA should have less than 5 degrees of phase shift at P1dB.
5. Measure two-tone IMD: apply two equal-amplitude tones spaced by a representative modulation bandwidth. Measure the third-order intermodulation products (2f1-f2 and 2f2-f1). OIP3 = Pout + IMR/2 where IMR is the ratio of the fundamental to the IMD product.
6. Measure ACPR with the actual modulated signal: apply the intended modulated waveform (LTE, 5G NR, Wi-Fi OFDM) at the intended average output power. Measure the adjacent channel power ratio. If ACPR does not meet the spectral mask, digital pre-distortion (DPD) may be needed.
7. If DPD is required: the PA must have sufficient bandwidth for the DPD correction signal (typically 3 to 5x the signal bandwidth). Verify the PA's memory effects (AM-AM and AM-PM variation with signal envelope frequency) are within the DPD algorithm's correction capability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
