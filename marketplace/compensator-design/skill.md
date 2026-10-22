# Compensator Design

Design the feedback compensator (Type I, II, or III) to achieve target crossover frequency with adequate phase and gain margins. Produce component values for the error amplifier network.

## Inputs

- `selected-control-mode`: VMC, PCM, or ACM with rationale
- `modified-plant-tf`: Plant transfer function as seen by the compensator

## Outputs

- `compensator-transfer-function`: Gc(s) with pole and zero locations, gain at crossover, and component values (R1, R2, R3, C1, C2, C3 for Type III around an op-amp or error amplifier)
- `loop-gain-analysis`: T(s) = Gc(s) * Gvd(s) * H(s) plotted: crossover frequency, phase margin (target >45 deg), gain margin (target >10 dB), and conditional stability check

## Process

1. Set the target crossover frequency fc. For converters without RHP zero: fc = fsw/10 to fsw/5. For converters with RHP zero: fc = fz_rhp / (3 to 5). Higher fc gives faster transient response but more noise sensitivity.
2. Choose compensator type. Type I (integrator): single pole at origin, provides infinite DC gain, zero steady-state error. Adequate only if plant has no resonant peak (e.g., PCM buck at light load). Type II (integrator + one zero + one pole): places zero below crossover to boost phase, pole above crossover for noise rejection. Adequate for single-pole plants (PCM). Type III (integrator + two zeros + two poles): places two zeros to compensate for the LC double-pole phase lag. Required for VMC with LC plant.
3. Place zeros and poles. Type III for VMC buck: place both zeros at or slightly below the LC resonance fp to cancel the -180 degree phase shift. Place both high-frequency poles at or above the ESR zero frequency and half the switching frequency (whichever is lower). Set the mid-band gain to make |T(jw)| cross 0 dB at fc.
4. Calculate component values. For a Type III compensator using an op-amp: R1 sets the DC gain, C1 and R2 set the lower zero and integrator pole, C2 and R3 set the upper zero, C3 sets the upper high-frequency pole. Formulas: fz1 = 1/(2*pi*R2*C1), fz2 = 1/(2*pi*(R1+R3)*C3), fp1 = 1/(2*pi*R2*C1*C2/(C1+C2)), fp2 = 1/(2*pi*R3*C3).
5. Verify with complete loop gain Bode plot. Check: phase margin > 45 degrees (60 preferred), gain margin > 10 dB, no conditional stability (gain does not re-cross 0 dB at lower frequencies), sufficient gain at line frequency for input rejection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
