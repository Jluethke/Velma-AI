# Feedback And Stability Design

Apply negative feedback to set the closed-loop gain, then verify stability through loop gain analysis, phase margin measurement, and compensation network design.

## Inputs

- `voltage-gain`: Open-loop gain Av and output resistance Rout
- `performance-spec`: Required closed-loop gain Acl, bandwidth, and phase margin (typically 60 degrees minimum)
- `noise-budget`: Noise analysis results to confirm feedback does not degrade SNR below spec

## Outputs

- `feedback-network`: The feedback topology (series-shunt, shunt-series, series-series, shunt-shunt) with component values (resistors, capacitors) and the feedback factor beta
- `stability-analysis`: Loop gain T(f) magnitude and phase plots showing unity-gain frequency, phase margin, and gain margin. Identification of all poles and zeros.
- `compensation-network`: The compensation components (Miller capacitor Cc, nulling resistor Rz if needed) with values and their effect on pole/zero locations

## Process

1. Choose the feedback topology based on what the application senses and returns. Voltage-voltage (series-shunt) feedback is most common for voltage amplifiers: it samples the output voltage and returns a fraction beta = R1/(R1+R2) to the input. Closed-loop gain is Acl = 1/beta when loop gain T = Av*beta >> 1.
2. Identify all poles in the open-loop transfer function. For a single-stage amplifier, the dominant pole is at fp1 = 1/(2*pi*Rout*CL) where CL is the total load capacitance. For a two-stage OTA, the first stage has a pole at 1/(2*pi*Rout1*Cc) after Miller compensation, and the second stage has a pole at gm2/(2*pi*CL).
3. For a two-stage Miller-compensated OTA, the compensation capacitor Cc creates a dominant pole at fp1 = 1/(2*pi*gm1*Rout1*Rout2*Cc) and pushes the non-dominant pole to fp2 = gm2/(2*pi*CL). For stability, fp2 must be above the unity-gain frequency fu = gm1/(2*pi*Cc). This gives the constraint: Cc > gm1*CL/gm2.
4. Miller compensation introduces a right-half-plane zero at fz = gm2/(2*pi*Cc) which degrades phase margin. Cancel it with a nulling resistor Rz = 1/gm2 in series with Cc, which moves the zero to infinity (or to the left half plane if Rz > 1/gm2, creating a left-half-plane zero for phase boost).
5. Verify phase margin by plotting the loop gain magnitude and phase. At the frequency where |T(f)| = 0 dB, the phase must be greater than -120 degrees (phase margin > 60 degrees). If margin is insufficient, increase Cc (moves fp1 down, reducing unity-gain frequency), or add a lead compensator (zero before the second pole). Also verify gain margin: at the frequency where phase(T) = -180 degrees, the gain must be below 0 dB by at least 10 dB.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
