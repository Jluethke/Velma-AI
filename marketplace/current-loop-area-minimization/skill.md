# Current Loop Area Minimization

Minimize radiation from differential-mode sources by reducing current loop areas in the PCB layout, with specific techniques for clocks, switching regulators, and digital buses.

## Inputs

- `emission-source-map`: Identified emission sources with frequencies
- `radiation-mode-assessment`: Which sources radiate as differential mode
- `stackup-cross-section`: PCB layer stackup for reference plane planning

## Outputs

- `loop-area-reduction-plan`: Specific layout changes for each differential-mode source: component placement, trace routing, via placement to minimize loop area
- `reference-plane-strategy`: Ground and power plane assignments to provide continuous return paths under all high-frequency traces
- `estimated-emission-reduction`: Expected dB reduction from each layout change based on loop area ratio

## Process

1. For switching regulators: the hot loop (input capacitor to high-side FET to low-side FET to ground and back to input capacitor) must be minimized. Place the input capacitor within 5 mm of the FET pins. Route the loop on a single layer if possible. Every mm^2 of loop area costs dB of margin. Calculate: reducing loop area by a factor of 2 reduces differential-mode radiation by 6 dB.
2. For clock signals: route clock traces over continuous reference planes with no splits, slots, or voids. If a clock trace must change layers, place the via directly adjacent to a ground via to provide a low-inductance return path. A layer change without a return via forces the return current to find another path, increasing the effective loop area by the detour distance.
3. For digital buses: keep signals and their returns on adjacent layers (signal on layer N, reference on layer N+1 or N-1). The loop area is trace_length * dielectric_height. Using thinner dielectric between signal and reference (e.g., 3 mil instead of 5 mil) reduces loop area by 40% and radiation by about 4 dB.
4. For every trace that crosses a plane split or slot: either move the trace or bridge the split with stitching capacitors (100 nF or larger) placed at the crossing point. The capacitor provides a return current path across the split at frequencies above its SRF.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
