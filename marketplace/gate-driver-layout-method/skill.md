# Gate Driver Layout Method

Layout the gate driver circuit for minimal parasitic inductance in the gate loop and power loop, with proper ground plane management and isolation barrier placement.

## Inputs

- `miller-mitigation-design`: Miller turn-on prevention measures selected
- `dv-dt-immunity`: Required dv/dt immunity level

## Outputs

- `gate-loop-layout`: PCB layout guidelines: gate driver IC to MOSFET gate/source routing with inductance budget, decoupling capacitor placement, ground plane strategy
- `isolation-barrier-design`: For isolated drivers: creepage and clearance distances, transformer or optocoupler placement, primary-to-secondary capacitance minimization

## Process

1. Minimize gate loop area. The gate loop is: driver output pin -> Rg -> MOSFET gate pin -> MOSFET source pin -> driver ground pin -> driver bypass cap -> driver Vcc pin. Every nH of inductance in this loop slows switching and adds ringing. Target: less than 5nH total loop inductance.
2. Place the gate driver IC as close as possible to the MOSFET, ideally within 10mm. The gate resistor sits between them. The driver bypass capacitor (100nF ceramic, X7R) sits directly across the driver Vcc and GND pins, on the same layer, with vias to the driver pads.
3. Route the gate trace as a wide, short trace (not 50-ohm controlled impedance; the gate is not a transmission line at these lengths). Use a ground plane directly underneath for return current. The Kelvin source trace returns from the MOSFET source pad to the driver GND, separate from the power ground carrying load current.
4. For isolated gate drivers, maintain the isolation barrier clearance on the PCB. IEC 62368: basic insulation requires 5mm clearance and 8mm creepage for 400V working voltage. Place the isolation barrier as a slot in the PCB if needed. Keep the primary-to-secondary coupling capacitance below 3pF to reduce common-mode current that causes EMI.
5. For the power loop (drain of high-side -> Vbus cap -> source of low-side), minimize inductance with wide, parallel planes or thick traces on adjacent layers. The power loop inductance determines the voltage overshoot at turn-off: Vspike = Lloop * di/dt. With Lloop = 5nH and di/dt = 1A/ns: Vspike = 5V. Reducing loop inductance is more effective than adding snubbers.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
