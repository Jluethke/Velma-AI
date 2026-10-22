# Layer Assignment And Reference Plane Strategy

Assign each layer's function (signal, ground, power) and pair signal layers with their reference planes to ensure continuous return current paths.

## Inputs

- `minimum-layer-count`: Layer count determined from density analysis
- `signal-classes`: Signal types with speed and impedance requirements
- `power-rail-count`: Power planes needed

## Outputs

- `layer-assignment-table`: Each layer's function (signal routing, ground reference, power plane), the signal classes routed on each signal layer, and the reference plane for each signal layer
- `signal-to-reference-pairing`: Which reference plane each signal layer uses for impedance control and return current
- `layer-transition-rules`: Rules for via transitions: which layer transitions are allowed without adding return vias, and which require ground stitching vias

## Process

1. Place ground planes on layers 2 and N-1 (second from top and second from bottom) for an N-layer board. This gives both outer signal layers a close reference plane for tight impedance control (thin dielectric = narrow trace for 50 ohms, good for fine-pitch BGAs).
2. Route the fastest signals on the layers closest to their reference planes. The outer layers (1 and N) have the thinnest dielectric to their reference (layer 2 and N-1), giving the tightest impedance control and smallest loop area. Route high-speed differential pairs here.
3. Assign power planes to inner layers. A ground-power plane pair separated by thin dielectric (2 to 4 mils) provides significant plane capacitance for PDN decoupling. Place this pair in the center of the stackup.
4. Define layer transition rules: a signal transitioning from layer 1 (referenced to ground on layer 2) to layer 3 (referenced to power on layer 4) changes reference planes. The return current must transfer between planes. Add a stitching capacitor (100 nF minimum) near the via to provide this path. If both layers reference the same ground plane, no stitching is needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
