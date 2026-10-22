# Pll Architecture Specification

Define the PLL architecture from output frequency, phase noise, lock time, and spur requirements. Select integer-N vs fractional-N and determine the reference frequency.

## Inputs

- `output-frequency-range`: Minimum and maximum output frequencies in MHz or GHz
- `phase-noise-spec`: Phase noise target at specific offset frequencies (e.g., -100 dBc/Hz at 1 MHz offset)
- `lock-time-requirement`: Maximum time to achieve lock in microseconds
- `spur-specification`: Maximum reference spur and fractional spur levels in dBc

## Outputs

- `pll-architecture`: Integer-N or fractional-N with division ratio range, reference frequency, and loop bandwidth target
- `component-specifications`: Specs for each block: PFD, charge pump, loop filter, VCO, divider

## Process

1. Determine the reference frequency. For integer-N, fref equals the channel spacing. For fractional-N, fref can be much higher (often 10-50 MHz), which allows wider loop bandwidth and faster lock time.
2. Calculate the division ratio N = fout / fref. For integer-N with narrow channel spacing, N is large (thousands), which multiplies the PFD noise by 20*log10(N) at the output. If this exceeds the close-in phase noise spec, fractional-N is required.
3. Set the loop bandwidth. For integer-N, bandwidth is limited to approximately fref/10 for reference spur rejection. For fractional-N, bandwidth can be fref/5 to fref/3, but fractional spurs set the practical limit. Wider bandwidth suppresses VCO phase noise at close-in offsets but passes more PFD/charge-pump noise.
4. Lock time is approximately 5/(2*pi*loop_bandwidth) for a critically damped loop. If the lock time spec requires wider bandwidth, fractional-N may be needed even if channel spacing alone does not require it.
5. Determine if sigma-delta modulation is needed for the fractional divider. A MASH 1-1-1 (third-order) modulator pushes quantization noise above the loop bandwidth. The sigma-delta order must be at least one more than the loop filter order for stability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
