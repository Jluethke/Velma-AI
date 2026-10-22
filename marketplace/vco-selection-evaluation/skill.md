# Vco Selection Evaluation

Select and evaluate the VCO for phase noise, tuning range, output power, and pushing/pulling performance across the operating conditions.

## Inputs

- `pll-architecture`: Required frequency range and division ratios
- `phase-noise-specification`: Phase noise requirements at far offsets where VCO dominates

## Outputs

- `vco-selection`: Selected VCO with phase noise, tuning range, tuning sensitivity (Kvco in MHz/V), output power, and pushing/pulling specifications
- `vco-evaluation-result`: VCO phase noise measured or predicted across the tuning range, with Kvco variation and its effect on loop dynamics

## Process

1. The VCO phase noise specification comes from the system requirement at offsets beyond the loop bandwidth, where the VCO noise is not suppressed by the loop. At 1 MHz offset, the PLL output phase noise equals the VCO phase noise directly.
2. VCO phase noise follows Leeson's model: L(fm) = (F*kT)/(2*Ps) * (1 + (f0/(2*Ql*fm))^2) * (1 + fc/fm), where F is the device noise factor, Ps is the signal power, Ql is the loaded Q of the resonator, fm is the offset frequency, f0 is the carrier, and fc is the flicker corner.
3. Higher resonator Q gives lower phase noise. LC VCOs with printed inductors achieve Q of 10 to 30. Dielectric resonator oscillators (DROs) achieve Q of 1000+. Cavity oscillators achieve Q of 10000+. Select based on the phase noise requirement and size/cost constraints.
4. Check the VCO tuning range covers the required output frequency range with margin. The tuning sensitivity Kvco (MHz/V) varies across the tuning range; higher Kvco means more sensitivity to supply noise but wider tuning. Kvco variation changes the loop bandwidth across the band, so verify stability at both extremes.
5. Evaluate VCO pushing (frequency change per supply voltage change) and pulling (frequency change with load impedance variation). Pushing is mitigated by clean power supply design. Pulling is mitigated by an isolator or buffer amplifier at the VCO output.
6. If using an integrated PLL/VCO IC: the VCO is internal and its Kvco is set by the IC. Verify the IC's VCO phase noise meets the requirement. Some ICs allow selecting VCO bands to reduce Kvco and improve phase noise.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
