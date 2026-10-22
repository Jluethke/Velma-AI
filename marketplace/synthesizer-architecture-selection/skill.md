# Synthesizer Architecture Selection

Select the PLL architecture (integer-N, fractional-N, or direct digital synthesis) based on the frequency plan, step size, and phase noise requirements.

## Inputs

- `frequency-plan`: Required output frequencies, step size (channel spacing), tuning range, and switching speed
- `phase-noise-specification`: Phase noise mask: maximum phase noise at each offset frequency (e.g., -80 dBc/Hz at 1 kHz, -110 dBc/Hz at 100 kHz)

## Outputs

- `pll-architecture`: Selected architecture (integer-N, fractional-N, multi-loop) with reference frequency, division ratios, and justification
- `loop-bandwidth-target`: Target loop bandwidth based on the phase noise crossover between reference and VCO noise

## Process

1. Determine the required frequency step size. For integer-N: step size equals the reference frequency (f_ref = f_step). For narrow channel spacing, this forces a low f_ref and high N, which degrades phase noise by 20*log10(N).
2. For fractional-N: the reference frequency can be much higher than the step size (f_ref >> f_step), reducing N and improving phase noise. The trade-off is fractional spurs at offsets related to the fractional component. Sigma-delta modulators (2nd or 3rd order) push spur energy to higher offsets where the loop filter attenuates it.
3. Estimate the in-band phase noise: L_in-band = L_ref + 20*log10(N) + L_PD + 10*log10(f_ref), where L_ref is the reference oscillator phase noise, L_PD is the phase detector/charge pump noise contribution (from the PLL IC datasheet, normalized to 1 Hz), and N is the division ratio.
4. Estimate the VCO phase noise requirement. At offsets beyond the loop bandwidth, the PLL output follows the VCO phase noise directly. The VCO phase noise at the offset of interest must meet the specification.
5. The optimal loop bandwidth is near the crossover point where in-band noise (dominated by reference and divider noise, shaped by the closed-loop transfer function) equals VCO noise (suppressed by the loop inside the bandwidth). Wider bandwidth suppresses VCO noise more but passes more reference noise.
6. If the phase noise specification cannot be met with a single-loop architecture, consider a multi-loop design or an offset PLL to reduce the division ratio.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
