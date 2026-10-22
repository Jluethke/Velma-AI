# Stability Compensation Design

Design frequency compensation to achieve the target phase margin, handling the right-half-plane zero in Miller-compensated amplifiers and ensuring stability across PVT corners.

## Inputs

- `transistor-dimensions`: Sized schematic
- `bias-currents`: Branch currents

## Outputs

- `compensation-network`: Compensation capacitor and nulling resistor values
- `open-loop-response`: Simulated gain and phase vs frequency at typical and worst-case corners

## Process

1. For a two-stage Miller amplifier, the compensation capacitor Cc creates the dominant pole at the output of the first stage: p1 = 1 / (2*pi*Rout1*Cc*A2), where A2 is the second-stage gain. This pole splitting pushes the non-dominant pole to higher frequency.
2. The non-dominant pole is at the output of the second stage: p2 approximately equals gm2 / (2*pi*CL), where CL is the load capacitance. For 60-degree phase margin, ensure that GBW < p2/2.2.
3. Miller compensation introduces a right-half-plane (RHP) zero at z = gm2 / (2*pi*Cc). This zero degrades phase margin. To cancel it, add a nulling resistor Rz in series with Cc: Rz = 1/gm2 moves the zero to infinity. Rz > 1/gm2 moves the zero to the left half plane to add phase boost.
4. Implement Rz with a triode-region MOSFET whose resistance tracks gm2 across PVT. This ensures the zero cancellation holds at all corners. Size the MOSFET so its W/L gives 1/gm2 at the bias point.
5. Simulate the open-loop frequency response (AC analysis) at five corners: TT, SS, FF, SF, FS, plus high and low temperatures. Verify phase margin exceeds the target (typically 60 degrees minimum) at all corners. The SS corner typically has the lowest GBW; the FF corner may have reduced phase margin due to shifted pole/zero locations.
6. If phase margin is insufficient, increase Cc (reduces GBW), increase gm2/CL ratio (push out p2), or add a feed-forward path from input to output stage for phase boost.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
