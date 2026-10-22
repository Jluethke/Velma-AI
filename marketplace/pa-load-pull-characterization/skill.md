# Pa Load Pull Characterization

Perform load-pull analysis to determine the optimal output impedance for the target output power and efficiency, and the optimal source impedance for gain and noise.

## Inputs

- `transistor-selection`: Selected transistor with datasheet parameters
- `pa-requirements`: Target output power, efficiency, and frequency

## Outputs

- `load-pull-contours`: Constant-power and constant-efficiency contours on the Smith chart at the fundamental and harmonic frequencies
- `optimal-impedances`: Optimal load impedance for power (Z_power) and for efficiency (Z_eff) at the fundamental, and required harmonic terminations

## Process

1. Load-pull is performed by systematically varying the load impedance presented to the transistor while measuring output power, efficiency, and gain. This can be done with a mechanical or electronic tuner, or in simulation using a nonlinear transistor model.
2. Present a range of impedances covering the relevant area of the Smith chart. At each impedance point, measure Pout, PAE (power-added efficiency = (Pout - Pin)/Pdc), gain, and drain current.
3. Plot constant-power contours: lines of equal Pout on the Smith chart. The peak power point is the optimal load for power. Plot constant-PAE contours similarly. The peak PAE point is the optimal load for efficiency.
4. These two optima are usually at different impedances. The power optimum is near the conjugate match of the large-signal output impedance. The PAE optimum is at a higher impedance (closer to the edge of the Smith chart), where the voltage swing is larger but the current is lower.
5. For class F or harmonic-tuned PAs: also perform harmonic load-pull at 2f0 and 3f0. The harmonic terminations shape the waveform and can significantly improve efficiency. Typical class F terminations: short at 2f0, open at 3f0.
6. Record the optimal impedances at the package reference plane (drain or collector pin). These must be transformed to the PCB reference plane by de-embedding the package parasitics (bondwire inductance, shunt package capacitance).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
