# Comparator Design Method

Design the comparator for the ADC, addressing offset, metastability probability, kickback noise, and speed requirements for the target resolution.

## Inputs

- `selected-architecture`: ADC architecture and resolution
- `sampling-capacitor-size`: Capacitor size affecting kickback sensitivity

## Outputs

- `comparator-schematic`: Sized comparator circuit with preamplifier if needed
- `metastability-analysis`: BER from metastability vs comparison time

## Process

1. For SAR ADCs, the comparator resolves one bit per clock cycle. The regeneration time constant tau_regen = C_latch / gm_latch determines how fast the comparator resolves. Metastability probability: P_error = exp(-t_comparison / (2*tau_regen)).
2. For N-bit resolution at fs sampling rate, the comparator has approximately T_clk/(N+1) time to resolve (for SAR). Calculate tau_regen required for BER < 10^-15 (one error per 10^15 conversions): t_comparison > 2*tau_regen * ln(1/BER) * tau_regen. This sets the minimum gm/C ratio.
3. Comparator offset directly reduces ADC accuracy. For a SAR ADC, comparator offset appears as a code-dependent error. The offset sigma = Avt / sqrt(W*L) of the input pair. For 10-bit with 1V full-scale, 1 LSB = 1 mV, so sigma_offset should be < 0.5 mV (requiring large input devices).
4. If the required input device area for low offset is too large (slows regeneration), add a preamplifier stage. The preamplifier reduces the offset contribution of the latch by its gain A_pre: effective offset = sigma_preamp + sigma_latch/A_pre. A gain of 4-10 is typical.
5. Kickback noise: when the comparator regenerates, the rapid voltage swing couples through the input pair's gate-drain capacitance back to the DAC or sampling node. Quantify: delta_V_kickback = Cgd * delta_V_latch / C_dac. If this exceeds 0.5 LSB, add a kickback cancellation technique (neutralization capacitors or isolation switch).
6. Design the strong-ARM latch comparator for minimum energy: dynamic comparators consume power only during comparison (no static bias current). Energy per comparison = C_total * VDD^2 + I_preamp * t_preamp * VDD. Minimize total energy by balancing preamplifier gain against latch regeneration speed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
