# Analog Matching Layout

Apply common-centroid, interdigitation, and dummy device techniques to lay out matched transistor pairs and capacitor arrays for minimum mismatch.

## Inputs

- `matched-device-pairs`: List of device pairs requiring matching (differential pairs, current mirrors, capacitor arrays) with matching specs
- `process-design-rules`: Layout DRC rules, minimum spacings, and matching-critical rules

## Outputs

- `matched-layout`: Layout for all matched structures with estimated residual mismatch
- `matching-verification`: Extraction results confirming parasitic symmetry

## Process

1. For differential pair transistors: use common-centroid layout. Split each transistor into multiple fingers and interleave: ABBA pattern for 2 devices. This cancels first-order gradients across the die (Vt gradient, oxide thickness gradient, stress gradient).
2. Orientation: place all matched transistors with the same gate orientation (either all horizontal or all vertical). Gate stress from shallow trench isolation (STI) depends on distance to the STI edge and transistor orientation. Inconsistent orientation causes systematic offset.
3. Add dummy devices at the ends of the array. Edge transistors have different etching and stress environments than interior transistors. Dummy devices absorb these edge effects. Connect dummy gates to VDD or VSS to avoid floating gates.
4. For capacitor arrays (SAR DAC): use a common-centroid arrangement for the MSB capacitors. Binary-weighted capacitors are split into unit capacitors and arranged with maximum symmetry. The unit capacitor must be large enough that edge effects (fringing capacitance) are a small fraction of total capacitance.
5. Route all matched signal paths with equal length and equal parasitic capacitance. Use symmetric routing: if signal A runs over metal-3, signal B must also run over metal-3 at the same distance. Guard rings around sensitive analog devices provide isolation from digital noise (substrate coupling).
6. Extract the layout and verify parasitic matching. Check that the parasitic capacitance mismatch on the drain nodes of a differential pair is less than the threshold set by the offset specification. Even 1 fF of asymmetric capacitance can cause measurable offset at high gm.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
