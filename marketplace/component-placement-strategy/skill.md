# Component Placement Strategy

Place power components to minimize critical loop areas, manage thermal paths, and separate noisy switching sections from sensitive analog and digital sections.

## Inputs

- `critical-loops-ranked`: Ranked current loops with target inductances
- `loop-inductance-budget`: Maximum inductance per loop

## Outputs

- `placement-plan`: Component placement on the PCB: power stage cluster with input caps immediately adjacent to MOSFETs, inductor placement, output cap bank, gate driver IC position, and control IC position with separation from switching node
- `keep-out-zones`: Keep-out zones under inductors (no sensitive traces), around switching nodes (high dv/dt), and clearance requirements for thermal management

## Process

1. Place the hot-loop components first. The high-side MOSFET, low-side MOSFET, and input decoupling capacitors form a tight cluster. Place the input caps between the MOSFET drain and source pads, on the same side of the board, as close as physically possible. For a half-bridge, the ideal layout has the two MOSFETs in a vertical stack with caps on either side.
2. Place the gate driver IC within 10mm of the MOSFET gates. The gate driver bypass capacitor goes directly across the driver Vcc and GND pins, on the same layer. Route the gate traces as short, wide paths. If using a bootstrap driver, the bootstrap cap and diode go between the driver and the high-side MOSFET.
3. Place the inductor. It connects from the switching node to the output. It is physically large and generates magnetic flux. Keep sensitive analog traces (feedback divider, current sense) away from the inductor magnetic field. Avoid routing any traces directly under the inductor unless they are on a ground plane layer.
4. Place the output capacitor bank at the inductor output, close to the load connection point. Multiple capacitors in parallel reduce ESR and ESL. Arrange them in a row with shared vias to the ground plane for minimal ESL contribution.
5. Place the control IC and analog components on the quiet side of the board, away from the switching node. The feedback voltage divider resistors should be close to the control IC, not close to the output capacitors (to avoid picking up switching noise through ground coupling). The current sense trace (if used) should be routed as a differential pair from the sense resistor to the control IC.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
