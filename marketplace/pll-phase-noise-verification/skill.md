# Pll Phase Noise Verification

Measure the phase noise of the assembled PLL synthesizer and verify it meets the specification, diagnosing and correcting any issues.

## Inputs

- `loop-filter-values`: Designed loop filter component values
- `vco-selection`: Selected VCO
- `pll-architecture`: Complete PLL architecture and component selections
- `phase-noise-specification`: Phase noise mask to verify against

## Outputs

- `measured-phase-noise`: Measured SSB phase noise in dBc/Hz at standard offsets (100 Hz, 1 kHz, 10 kHz, 100 kHz, 1 MHz), compared to specification mask
- `spur-analysis`: Measured spurious signals: reference spurs (at f_ref offset), fractional spurs (for fractional-N), and any other discrete spurs, with levels in dBc

## Process

1. Measure phase noise using a signal source analyzer or spectrum analyzer with phase noise measurement capability. For close-in offsets (< 10 kHz), a cross-correlation method (two independent measurement paths averaged) reduces the instrument noise floor.
2. Plot the measured phase noise against the specification mask. The plot should show three distinct regions: in-band flat region (dominated by reference/charge pump noise multiplied by N^2), the transition through the loop bandwidth, and the out-of-band slope (VCO noise, falling at -20 dB/decade for white FM or -30 dB/decade for flicker FM).
3. If in-band phase noise is too high: check the reference oscillator phase noise (it may be worse than specified), verify the charge pump current setting, check for noise on the charge pump power supply, and verify the division ratio is as expected.
4. If the loop bandwidth is wrong (transition frequency is not where designed): measure Kvco at the operating frequency (it may differ from the datasheet value at this tuning voltage). Recalculate the loop with the actual Kvco.
5. Measure reference spurs at +/- f_ref offset from the carrier. Reference spurs come from charge pump current mismatch, leakage, and power supply coupling. If spurs exceed specification: increase loop filter attenuation at f_ref (add a pole), improve charge pump power supply filtering, or reduce charge pump current mismatch (some ICs have calibration registers).
6. For fractional-N: measure fractional spurs. Their offset frequencies depend on the fractional word and sigma-delta modulator pattern. If fractional spurs are excessive: increase the sigma-delta modulator order, increase the reference frequency (which reduces the fractional spur amplitude relative to the carrier), or apply spur avoidance by avoiding certain fractional values near integer boundaries.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
