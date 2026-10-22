# Docking Capture Mechanism

Define the capture method, envelope, and contact loads for docking or berthing.

## Inputs

- `maneuver_sequence`: Final approach that sets the closing conditions.
- `nav_accuracy`: Alignment accuracy at contact.
- `target_orbit`: Target that the mechanism must mate with.

## Outputs

- `docking_mechanism`: Docking or berthing mechanism type.
- `capture_envelope`: Allowed misalignment and closing rate at contact.
- `contact_loads`: Loads the mechanism and structure must absorb.

## Process

1. Distinguish docking (the vehicle flies itself into capture at a higher closing rate) from berthing (an arm grapples and places a passive vehicle at a low rate).
2. Pick a mechanism type: probe-and-drogue, or an androgynous ring that lets either side be active and supports the common docking interface standard.
3. Define the capture envelope: lateral and angular misalignment limits plus a closing rate near 0.05 to 0.1 m/s for a soft capture.
4. Absorb contact energy with dampers in the soft-capture ring, then draw the interfaces together and engage structural latches for a hard mate.
5. Size the structure for the contact loads from the relative mass and closing rate, and verify the load path through the latches and the pressurized or utility interfaces.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
