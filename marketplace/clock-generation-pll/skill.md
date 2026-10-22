# Clock Generation Pll

Design the clock generation circuit (PLL or DLL) that provides a stable, low-jitter sampling clock for the data converters.

## Inputs

- `clock-spec`: Output frequency, jitter requirement (RMS and peak-to-peak), phase noise mask, reference clock frequency and quality
- `system-context`: Whether the clock drives an ADC (aperture jitter matters) or digital logic (duty cycle and skew matter)

## Outputs

- `pll-design`: PLL architecture (integer-N, fractional-N), VCO type (ring, LC), loop filter component values, division ratio, and predicted phase noise and jitter
- `jitter-budget`: Breakdown of jitter contributions: VCO phase noise, reference noise, charge pump noise, and power supply coupling

## Process

1. For ADC clocking, the maximum tolerable aperture jitter is: tj_rms < 1/(2*pi*fin*2^(ENOB+1)) where fin is the input signal frequency. For a 14-bit ADC sampling a 10 MHz signal, tj_rms < 1/(2*pi*10e6*2^15) = 0.49 ps RMS. This is achievable with an LC VCO PLL but not a ring oscillator PLL.
2. For an integer-N PLL: fout = N * fref. The loop bandwidth must be low enough to filter VCO phase noise but high enough to track reference noise and achieve fast lock time. Typical loop bandwidth is fref/10 to fref/20. The phase detector comparison frequency is fref, and the division ratio N = fout/fref.
3. VCO selection: ring oscillator PLLs achieve 1 to 10 ps RMS jitter at 100 MHz to 1 GHz, suitable for digital clocking. LC oscillator PLLs achieve 0.1 to 1 ps RMS jitter but require on-chip inductors (area-intensive) or external crystals. For high-resolution ADC clocking, an LC VCO or a crystal oscillator with a jitter-cleaning PLL is required.
4. Loop filter design for a charge pump PLL: the loop filter converts the charge pump current pulses into a smooth VCO control voltage. A third-order filter (two capacitors and one resistor) is standard. The zero frequency is: fz = 1/(2*pi*R*C1). The pole frequencies are: fp1 = 1/(2*pi*R*C1*C2/(C1+C2)) and fp2 from the third capacitor. Place fz at the loop bandwidth and fp1, fp2 above to ensure phase margin > 60 degrees.
5. Simulate phase noise: the total output phase noise is the reference noise multiplied by N^2 inside the loop bandwidth, and the VCO noise outside the loop bandwidth. At the crossover frequency, both contributions should be roughly equal (optimal noise performance). Integrate the phase noise from 100 Hz to half the sampling frequency to get RMS jitter.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
