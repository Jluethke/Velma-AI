# Guard Ring And Isolation Design

Design guard rings, deep n-well isolation, and substrate contacts to prevent latch-up and minimize substrate noise coupling between analog and digital blocks.

## Inputs

- `floor-plan`: Die floor plan with analog, digital, and I/O block locations
- `process-design-rules`: Guard ring rules and well spacing requirements

## Outputs

- `isolation-layout`: Guard ring and well isolation structures placed on the floor plan
- `latchup-analysis`: Holding current and trigger current analysis for each I/O and power domain boundary

## Process

1. Latch-up occurs when the parasitic PNPN thyristor (formed by PMOS source, n-well, p-substrate, NMOS source) turns on. Triggering: current injection exceeding the holding current of the parasitic thyristor, voltage transients on I/O pads, or ESD events.
2. Place n-well guard rings (connected to VDD) around PMOS devices and p+ substrate guard rings (connected to VSS) around NMOS devices. The guard ring intercepts minority carriers before they reach the parasitic bipolar base, increasing the trigger current by 10-100x.
3. At power domain boundaries (where VDD of one domain can be off while another is on), place double guard rings: both n-well and p+ rings between the domains. This prevents forward-biasing the well-substrate junction when one supply is off.
4. Deep n-well isolation: for sensitive analog NMOS transistors, place them in a deep n-well. This creates a fully isolated p-well that can be biased independently, blocking substrate noise from the shared p-type substrate. The noise rejection is typically 20-40 dB better than without deep n-well.
5. Space analog and digital blocks apart. Digital switching noise couples through the substrate with attenuation that depends on distance, substrate resistivity, and frequency. Typical guideline: 50-100 um minimum spacing for 10-bit accuracy, with substrate contacts every 20-30 um in the analog region to provide a low-impedance path to the analog ground.
6. Verify with substrate resistance extraction: extract the substrate resistance network between digital aggressors and analog victims. Simulate the substrate noise at the analog devices when the digital block switches. If the coupled noise exceeds 0.5 LSB equivalent, increase spacing or add more guard rings.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
