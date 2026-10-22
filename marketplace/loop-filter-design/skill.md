# Loop Filter Design

Design the PLL loop filter to achieve the target bandwidth, phase margin, and spur rejection while maintaining loop stability.

## Inputs

- `pll-architecture`: Architecture, reference frequency, division ratio, and PLL IC parameters (charge pump current, VCO gain)
- `loop-bandwidth-target`: Target bandwidth and constraints on settling time and spur rejection

## Outputs

- `loop-filter-values`: Component values for the loop filter (R and C values for each element), with the filter topology (type II 3rd-order, 4th-order, etc.)
- `loop-analysis`: Open-loop gain and phase plots, bandwidth, phase margin, and time-domain step response (settling time)

## Process

1. Gather the PLL IC parameters: charge pump current (Icp), phase detector gain (Kpd = Icp/(2*pi)), and VCO gain (Kvco in Hz/V, from the VCO datasheet or tuning curve).
2. For a type II, 3rd-order loop (most common): the loop filter has two capacitors (C1, C2) and one resistor (R1) in a specific topology (C1 in series with R1, both in shunt, with C2 in shunt). The 3rd pole from C2 provides additional reference spur filtering.
3. Calculate the loop natural frequency and damping from the target bandwidth and phase margin. For 45 degrees phase margin, the zero is placed at about BW/4 and the pole at about BW*4. For 60 degrees phase margin, place the zero at BW/5 and pole at BW*5.
4. R1 = (phase_margin factor) / (Icp * Kvco * C1). T1 = R1 * C1 (zero time constant). T2 = R1 * C2 (pole time constant, where C2 is typically C1/10 to C1/20).
5. Verify the open-loop gain crosses 0 dB at the target bandwidth with the target phase margin. Plot the open-loop transfer function: H(s) = Kpd * Z(s) * Kvco / (s * N) where Z(s) is the filter transfer function.
6. Check the reference spur rejection: the loop filter attenuation at the reference frequency offset (f_ref) determines how much the charge pump pulses appear at the VCO output. For a 3rd-order filter, attenuation at f_ref is approximately 20*log10(BW/f_ref) * 3. If insufficient, add a 4th pole.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
