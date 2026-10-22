# Layer Count Determination

Determine the minimum layer count from routing density analysis, signal integrity requirements, and power delivery requirements.

## Inputs

- `component-pin-count`: Total I/O pin count and BGA pitch for all components
- `signal-classes`: Signal types with their impedance, spacing, and reference plane requirements
- `power-rail-count`: Number of distinct power rails and their current requirements
- `board-area`: Available board area after component placement

## Outputs

- `minimum-layer-count`: Minimum layers needed, broken down: N signal layers + M reference planes + K power planes
- `routing-density-analysis`: Traces per channel between BGA pads, available routing channels vs required, and the layer count that resolves the bottleneck
- `layer-count-justification`: Engineering rationale for each layer: why it is needed and what happens if it is removed

## Process

1. Calculate routing density: for a BGA with P mm pitch, the channel width between pads is approximately P - pad_diameter. At 1.0 mm pitch with 0.5 mm pads, the channel is 0.5 mm. A 4 mil (0.1 mm) trace with 4 mil space fits 2 traces per channel (one trace + one space = 0.2 mm, two fit in 0.5 mm with 0.1 mm margin). For a 400-pin BGA, roughly 200 signals must escape, requiring 200/2 = 100 channels on a single layer, or fewer layers if more channels are available.
2. Add reference plane requirements: every signal layer needs a continuous reference plane on an adjacent layer for impedance control and return current. The minimum is signal-reference-signal (3 layers) but this only works if both signal layers can share the reference. For controlled impedance on both signal layers, each needs its own dedicated reference.
3. Add power plane requirements: each power rail that supplies more than 1A typically needs its own plane (or a large pour on a shared layer). Count the rails. The most common arrangement: core voltage, I/O voltage, analog voltage each get a plane or pour.
4. The standard stackup formula: L = 2 * (S + 1) where S is the number of signal layers needed and each signal layer has a reference. Add power planes. Round up to an even number (fabricators prefer even layer counts for symmetric construction). Common counts: 4 (2 signal, 2 reference/power), 6 (3+3), 8 (4+4), 10 (5+5), 12 (6+6).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
