# Layout Parasitic Verification

Extract layout parasitics and verify that the post-layout circuit still meets gain, bandwidth, noise, and stability specifications, iterating the design if parasitic capacitance or resistance degrades performance.

## Inputs

- `stability-analysis`: Pre-layout stability analysis with pole/zero locations and phase margin
- `bias-conditions`: Transistor sizes and operating points for layout
- `performance-spec`: All specifications that must hold post-layout

## Outputs

- `post-layout-performance`: Gain, bandwidth, phase margin, noise, CMRR, and PSRR after parasitic extraction, compared against pre-layout values and spec limits
- `layout-iteration-log`: Any changes made to the schematic or layout to recover performance lost to parasitics (guard rings, shielding, dummy devices, wider routing)

## Process

1. Match differential pair transistors by using common-centroid layout with interdigitated fingers (ABBA pattern minimum, ABBAABBA for high matching). This reduces Vos from random threshold mismatch, which scales as AVT/sqrt(W*L) where AVT is the Pelgrom coefficient from the process.
2. Add dummy devices at the ends of matched arrays to equalize the etch environment. Dummy devices are identical transistors with gate tied to supply (always off) that make the edge effects symmetric.
3. Extract parasitic capacitances at high-impedance nodes (drain of cascode, output node). The parasitic capacitance from routing and well-to-substrate junctions adds directly to the load capacitance CL, shifting poles. If the extracted CL is more than 20 percent above the schematic estimate, the phase margin will degrade and Cc may need to increase.
4. Extract parasitic resistance in the bias current mirror routing. Even 10 ohms of resistance in a mirror connection introduces a Vgs mismatch of 10*Id, which can be several millivolts and cause systematic current mismatch between branches.
5. Run post-layout simulation across process corners (TT, FF, SS, FS, SF) and temperature (-40C, 27C, 125C). The spec must be met at all corners, not just typical. If any corner fails, identify which parasitic or device variation caused the failure and adjust: increase device size for matching, add shielding for substrate noise coupling, or widen metal for resistance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
