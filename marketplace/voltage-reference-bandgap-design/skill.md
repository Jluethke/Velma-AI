# Voltage Reference Bandgap Design

Design a bandgap voltage reference that provides a stable, temperature-independent reference voltage for the data converters.

## Inputs

- `reference-spec`: Target reference voltage (typically 1.2V for bandgap), temperature coefficient TC in ppm/C, PSRR requirement, settling time
- `process-parameters`: Available BJT or parasitic bipolar parameters (Is, beta, Vbe at room temperature), supply voltage

## Outputs

- `bandgap-circuit`: Schematic with component values: resistor ratio, BJT area ratio, and bias current, plus the resulting TC and PSRR
- `startup-circuit`: The startup circuit that prevents the bandgap from latching at the zero-current degenerate operating point

## Process

1. The bandgap principle: Vref = Vbe + K*delta_Vbe, where Vbe has a negative TC of about -1.8 mV/C, and delta_Vbe = VT*ln(N) has a positive TC (VT = kT/q increases with temperature). N is the BJT area ratio. Choose K = Vbe_TC / (VT_TC * ln(N)) so the positive and negative TCs cancel at the reference temperature.
2. For a standard Brokaw bandgap: two BJTs with area ratio N (typically 8), a resistor R1 that sets the PTAT current I_PTAT = delta_Vbe/R1 = VT*ln(N)/R1, and a resistor R2 that converts this current to the PTAT voltage. Vref = Vbe + R2*I_PTAT = Vbe + (R2/R1)*VT*ln(N). For Vref = 1.2V: (R2/R1)*VT*ln(N) must equal about 0.55V at room temperature.
3. First-order TC cancellation gives about 20 to 50 ppm/C. For better TC, add curvature correction. The Vbe curvature (Vbe is not perfectly linear in T) can be compensated by adding a second PTAT^2 current or by using a piecewise-linear correction circuit. State-of-the-art curvature-corrected bandgaps achieve 1 to 5 ppm/C over -40 to 125C.
4. The startup circuit must inject a small current into the self-biased loop to kick it out of the zero-current state, then turn itself off so it does not inject offset. A simple approach: a PMOS with gate tied to the bandgap output through an inverter; when the output is zero, the PMOS turns on and injects current; once the bandgap rises above the inverter threshold, the PMOS turns off.
5. PSRR of the bandgap is set by how well the bias current mirrors reject supply variation. A cascode current mirror improves DC PSRR by 20 to 40 dB over a simple mirror. For high-frequency PSRR, the output must be buffered or filtered. Verify PSRR from DC to 1 MHz, as the ADC reference PSRR directly translates to supply-induced noise at the ADC output.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
