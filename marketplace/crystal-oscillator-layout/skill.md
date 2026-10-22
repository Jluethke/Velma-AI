# Crystal Oscillator Layout

Layout a crystal oscillator circuit for reliable startup, frequency accuracy, and minimum EMI.

## Inputs

- `crystal-parameters`: Crystal frequency, load capacitance, ESR, and drive level
- `oscillator-ic`: IC with oscillator pins (XTAL_IN, XTAL_OUT) and its recommended circuit
- `emc-emi-requirements`: EMI constraints on the clock circuit

## Outputs

- `crystal-placement`: Crystal position relative to IC, load capacitor positions, and ground connection
- `routing-rules`: Trace length, width, and spacing rules for XTAL_IN and XTAL_OUT traces
- `emi-mitigation`: Guard ring or ground pour design around the crystal circuit for EMI containment

## Process

1. Place the crystal as close to the IC oscillator pins as physically possible (5 mm maximum for most crystals, 3 mm for high-frequency crystals above 25 MHz). The traces from IC to crystal must be short because they carry a high-impedance, low-amplitude signal that is susceptible to noise pickup and adds parasitic capacitance that detunes the oscillator.
2. Place the load capacitors (CL1, CL2) directly at the crystal pads, connected to ground through short, dedicated ground vias. These capacitors set the oscillator frequency: C_load = (CL1 * CL2) / (CL1 + CL2) must equal the crystal's specified load capacitance minus the parasitic capacitance of the traces and IC pins (typically 3 to 5 pF). Getting this wrong shifts the frequency and can prevent startup.
3. Route XTAL_IN and XTAL_OUT as short, direct traces. Do not route them as parallel traces (couple noise between them). Keep them away from all other signals, especially digital clocks and switching regulators. A 10 mil minimum clearance from other traces, 50 mil from noisy signals. Do not put vias in the crystal traces; route on a single layer.
4. Surround the crystal circuit with a ground guard pour on the same layer, connected to the ground plane with vias every 50 to 100 mils. This contains the crystal's EMI (the crystal is a narrow-band radiator at its fundamental frequency and harmonics) and shields the circuit from external noise. Do not route any other signal through this ground pour.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
