# Copper Pour And Thermal Via Design

Design the copper pours and thermal via arrays for current carrying capacity and heat spreading, balancing electrical performance with thermal management.

## Inputs

- `placement-plan`: Component placement with power flow paths identified
- `keep-out-zones`: Areas excluded from routing and pours

## Outputs

- `copper-pour-plan`: Copper pour allocation per layer: which layers carry power current, which are ground/reference planes, pour widths for current capacity (IPC-2152), and polygon connection strategy
- `thermal-via-specification`: Thermal via arrays under power components: via diameter, plating thickness, pitch, array size, and calculated thermal resistance contribution

## Process

1. Size copper traces and pours for current. IPC-2152 is the current standard for trace width vs current. For external layers with 1oz copper, 10A requires approximately 200mil (5mm) trace width for 20C rise in still air. Internal layers need wider traces (less heat dissipation). Use a calculator or the IPC charts for the exact width at your copper weight and temperature rise target.
2. Design the ground plane. A continuous, unbroken ground plane on one inner layer is ideal. It provides: low-impedance return path for all signals, reference plane for controlled impedance, electromagnetic shielding between layers. Do not split the ground plane unless absolutely required for mixed-signal isolation, and even then, connect the splits at a single point.
3. Thermal via arrays under power pads. For SMD power components (D2PAK, QFN exposed pad), thermal vias carry heat from the pad to inner copper layers and the bottom of the board. Via specification: 0.3mm drill diameter, 0.025mm copper plating (or filled and capped for better thermal conductivity). Pitch: 1.2mm center-to-center (standard drill), or 0.8mm for high-density. Each via contributes approximately 80 C/W thermal resistance. A 3x3 array of 9 vias: 80/9 = 9 C/W.
4. Via-in-pad considerations. For QFN and BGA packages, thermal vias directly in the pad provide the best thermal path. If using solder paste: use filled and capped vias to prevent solder wicking through the via (which creates voids under the pad). If blind vias are available: use blind microvias in the pad layer for zero wicking risk.
5. Power plane allocation for multi-layer boards. For a 4-layer board: Layer 1 = components and power routing, Layer 2 = ground plane (unbroken), Layer 3 = power planes (Vin, Vout), Layer 4 = components and routing. For a 6-layer board: add dedicated power layers for high-current paths. The switching node copper area should be minimized (it is a high dv/dt noise source) while maintaining adequate current capacity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
