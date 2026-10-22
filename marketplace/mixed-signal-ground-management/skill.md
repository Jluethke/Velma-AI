# Mixed Signal Ground Management

Manage the ground system to prevent switching noise from corrupting sensitive analog measurements (voltage feedback, current sense, temperature) and digital control signals.

## Inputs

- `copper-pour-plan`: Copper and ground plane allocation
- `thermal-via-specification`: Via placement that may affect ground plane integrity

## Outputs

- `ground-strategy`: Ground connection scheme: single ground plane with strategic routing to keep high-current return paths away from sensitive signals, or star ground point if plane is not feasible
- `sensitive-trace-routing`: Routing rules for feedback divider, current sense, reference voltage, and communication signals (I2C, SPI, UART): trace placement, guard traces, and via-free zones

## Process

1. Understand ground current flow. In a buck converter, the high-frequency switching current flows in the hot loop: Vin cap -> high-side MOSFET -> switching node -> low-side MOSFET -> ground -> back to Vin cap. This return current flows through the ground plane under the hot loop. Any sensitive circuitry in this return path picks up noise via the shared impedance.
2. Route the hot loop return current away from the control IC. The power ground (high-current return) and signal ground (control IC reference, feedback divider return) should connect to the ground plane at separate points, with the signal ground connection on the quiet side of the board. This is a star ground implemented on a plane.
3. Feedback voltage divider routing. The divider resistors connect from Vout to the control IC feedback pin to ground. Route the trace from the divider output to the FB pin as a short, direct path close to the ground plane. Do not route it near the switching node or inductor. Place a small filter cap (100pF-1nF) at the FB pin to ground to reject high-frequency noise.
4. Current sense routing. If using a sense resistor in the power path: route the sense traces as a differential pair, directly from the resistor kelvin pads, away from the switching node, to the current sense input of the controller. Guard traces on both sides tied to ground can reject capacitively coupled noise.
5. Communication and digital signal routing. I2C/SPI/UART to the BMS or controller: route these on the quiet side of the board, away from switching power. Add series termination resistors (22-100 ohms) at the source to reduce ringing. For long runs (more than 50mm), add ground guard traces. Keep digital signals away from the analog feedback path to prevent clock noise coupling into the regulation loop.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
