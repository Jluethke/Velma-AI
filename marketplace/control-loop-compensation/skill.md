# Control Loop Compensation

Design the voltage or current mode control loop for the power converter, ensuring stable regulation with adequate phase margin and transient response.

## Inputs

- `selected-topology`: Converter topology and operating mode
- `power-stage-transfer-function`: The control-to-output transfer function Gvd(s) derived from the power stage small-signal model (including inductor, capacitor ESR, and load)
- `performance-spec`: Bandwidth target, phase margin target (minimum 45 degrees, typically 60), load transient response (voltage deviation and recovery time)

## Outputs

- `compensator-design`: Compensator type (Type I, II, or III), component values (resistors, capacitors in the feedback network), and the resulting loop gain Bode plot
- `transient-performance`: Predicted load step response: voltage undershoot/overshoot and recovery time, compared against spec

## Process

1. Derive the power stage transfer function. For a voltage-mode buck in CCM: Gvd(s) = Vin * (1 + s*Resr*Cout) / (1 + s*(L/R + Resr*Cout) + s^2*L*Cout) where R = Vout/Iout. This has a double pole at f_LC = 1/(2*pi*sqrt(L*Cout)) and an ESR zero at f_ESR = 1/(2*pi*Resr*Cout). The double pole gives -180 degrees phase shift, requiring a Type III compensator to add phase boost.
2. For current-mode control, the inner current loop converts the double-pole plant into a single-pole system (the inductor pole is absorbed into the current loop), simplifying the voltage loop compensator to Type II. The current-mode plant is approximately Gvc(s) = Ri * R / (1 + s*R*Cout) where Ri is the current sense gain. This is a single pole at 1/(2*pi*R*Cout).
3. Type III compensator has two zeros and three poles (including the origin). Place the two zeros at or below the LC double pole frequency to provide phase boost. Place the two high-frequency poles at the ESR zero frequency and at half the switching frequency to attenuate switching ripple. Set the crossover frequency (0 dB loop gain) to fsw/5 to fsw/10 for adequate gain margin.
4. The crossover frequency sets the transient response speed. For a load step delta_I, the output voltage deviation is approximately delta_V = delta_I / (2*pi*fc*Cout) where fc is the crossover frequency. To meet a 50mV transient spec with a 5A load step and 100uF output capacitance, fc must be at least 5/(2*pi*0.05*100e-6) = 159 kHz. If this exceeds fsw/5, increase Cout or relax the transient spec.
5. Verify the compensated loop gain Bode plot: confirm phase margin > 45 degrees at the crossover frequency, gain margin > 10 dB at the -180 degree phase crossing, and that the loop gain rolls off at -20 dB/decade through crossover (indicating a single integration). Simulate a load step to verify the transient matches prediction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
