# Analog Spec To Topology Selection

Translate analog performance specifications into a topology choice by evaluating gain, bandwidth, swing, power, and noise requirements against standard op-amp architectures.

## Inputs

- `performance-specifications`: DC gain, unity-gain bandwidth, phase margin, output swing, power budget, noise, CMRR, PSRR requirements
- `process-parameters`: Technology node, available Vt flavors, supply voltage, transistor models

## Outputs

- `selected-topology`: Chosen op-amp architecture with annotated schematic showing each transistor's role
- `topology-rationale`: Quantitative justification for why this topology meets each specification

## Process

1. Check if a single-stage topology suffices: telescopic cascode provides the highest speed (single dominant pole) and best noise (only one gm in the signal path), but output swing is limited to VDD - 4*Vdsat. If swing is tight, rule it out.
2. Folded cascode trades one Vdsat of swing (VDD - 3*Vdsat) for the ability to handle rail-to-rail common-mode input. Speed is similar to telescopic. Use when CMRR or input range matters more than maximum swing.
3. Two-stage Miller compensated amplifier provides the widest output swing (VDD - 2*Vdsat) and separable gain and bandwidth. First stage sets gain and GBW; second stage sets swing and slew rate. The compensation capacitor Cc creates the dominant pole.
4. If DC gain exceeds 80 dB, a single cascode stage might not suffice in advanced nodes (where intrinsic gain gm*ro drops below 20). Consider gain-boosted cascode (regulated cascode) or a two-stage design.
5. For fully differential designs, a common-mode feedback (CMFB) circuit is required. Switched-capacitor CMFB is simpler but limits to clocked systems. Continuous-time CMFB uses a separate amplifier and is needed for continuous-time filters.
6. Record the topology choice with the specific quantitative reason: e.g., 'Two-stage Miller: need 80 dB gain (single-stage max is 60 dB at this node) and 0.8V output swing (telescopic gives only 0.4V at VDD=1.0V).'

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
