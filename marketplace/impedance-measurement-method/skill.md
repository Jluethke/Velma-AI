# Impedance Measurement Method

Measure the output impedance of the converter and the input impedance of the load using a frequency response analyzer or network analyzer, for stability verification and PDN characterization.

## Inputs

- `efficiency-curve`: Efficiency data to establish operating points for impedance measurement
- `loss-budget-verification`: Loss analysis to identify components affecting impedance

## Outputs

- `output-impedance-plot`: Converter output impedance magnitude and phase vs frequency from 10Hz to 10MHz, showing the closed-loop impedance (with feedback active) and open-loop impedance (feedback disabled)
- `stability-margin-measurement`: Measured loop gain (using the Middlebrook or Ridley injection method) showing crossover frequency, phase margin, and gain margin under actual operating conditions

## Process

1. Output impedance measurement. Inject a small AC current into the output using a signal generator and a wideband current injection transformer. Measure the resulting AC voltage at the output. Zout(f) = Vac_out(f) / Iac_injected(f). Sweep from 10Hz (below the loop bandwidth) to 10MHz (above the switching frequency). The closed-loop output impedance shows the effect of the feedback loop.
2. Loop gain measurement using voltage injection (Middlebrook method). Break the feedback loop at the output of the error amplifier. Inject a small AC signal in series with the loop. Measure the signals on both sides of the injection point: T(f) = -Vreturn(f) / Vinject(f). The magnitude crossover gives the bandwidth; the phase at crossover gives the phase margin. Use an injection transformer (Picotest J2111A or similar) rated for the frequency range.
3. Practical considerations: the injection signal must be small enough not to perturb the operating point (typically 10-50mV at the output, or 1-5% of the error amplifier output swing). Too large and the measurement includes nonlinear effects. Too small and the signal-to-noise ratio is poor. Use averaging (64-256 averages) to reduce noise.
4. Input impedance measurement. Important for verifying the Middlebrook stability criterion with the input filter. Inject AC current at the converter input and measure the AC voltage. The converter input impedance for a regulated converter is negative at low frequency (negative resistance) and transitions to positive impedance at higher frequency. The filter output impedance must remain below this curve.
5. Compare measured results to design predictions. The crossover frequency should match the compensator design within 20%. Phase margin should match within 5 degrees. If there is a significant discrepancy, investigate: incorrect component values, parasitic elements not in the model, layout issues (extra inductance in the feedback path), or measurement artifact (probe loading, injection transformer bandwidth).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
