# Plant Model Derivation

Derive the small-signal transfer function of the power stage using state-space averaging, identifying poles, zeros, and any right-half-plane zeros.

## Inputs

- `converter-topology`: Selected topology with schematic and component values (L, C, Rload, Rdc, ESR)
- `operating-point`: Nominal duty cycle, input voltage, output voltage, and load current at which to linearize

## Outputs

- `control-to-output-tf`: Gvd(s): transfer function from duty cycle perturbation to output voltage, with numerical pole and zero locations
- `line-to-output-tf`: Gvg(s): transfer function from input voltage perturbation to output voltage (audiosusceptibility), for input feedforward if needed

## Process

1. Write the state equations for each switch state (on and off). State variables are inductor current and capacitor voltage. For buck: during on-time, diL/dt = (Vin - Vout - iL*Rdc)/L; dVout/dt = (iL - Vout/R)/C.
2. Apply state-space averaging: weight each state equation by its duty cycle fraction. Introduce small-signal perturbations: d = D + d_hat, vin = Vin + v_hat_in, vout = Vout + v_hat_out, iL = IL + i_hat_L. Collect first-order AC terms, discard DC and second-order.
3. Solve for Gvd(s) = v_hat_out / d_hat. For voltage-mode buck: Gvd(s) = Vin * (1 + s*Rc*C) / (1 + s*(L/R + C*(Rc+Rdc)) + s^2*L*C*(1+Rc/R)). The ESR zero is at fz = 1/(2*pi*Rc*C). The LC double pole is at fp = 1/(2*pi*sqrt(L*C)).
4. For boost in CCM, derive the RHP zero: Gvd(s) has a zero at s = R*(1-D)^2/L (positive, meaning RHP). This limits control bandwidth to about 1/3 to 1/5 of fz_rhp. At worst case (max D, max load), calculate the minimum RHP zero frequency.
5. Plot the Bode diagram of Gvd(s) with numerical values. Identify the gain at DC (Vout/D for buck), the LC resonance peak (Q = R*sqrt(C/L) for lightly damped), the ESR zero, and the -2 slope (-40 dB/decade) from the double pole. This is the plant that the compensator must shape.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
