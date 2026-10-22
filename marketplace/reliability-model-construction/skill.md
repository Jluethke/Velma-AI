# Reliability Model Construction

Build the reliability block diagram from the system architecture, capturing series, parallel, standby, and voting redundancy relationships.

## Inputs

- `system-architecture`: Block diagram showing all functional elements and their redundancy relationships
- `reliability-target`: System-level reliability requirement (MTBF, probability of success for a mission, or availability)

## Outputs

- `reliability-block-diagram`: RBD showing each functional block, its redundancy type (series, active parallel, standby, k-of-n voting), and the switching/detection mechanisms for redundant paths
- `block-to-hardware-mapping`: Each RBD block mapped to the physical hardware that implements it, including shared hardware that appears in multiple functional paths
- `failure-definition`: For each block, the failure criteria: what constitutes block failure in terms of performance parameters

## Process

1. Start from the functional architecture, not the physical architecture. Two physically separate boards might be functionally in series (both must work) or parallel (either can perform the function). Draw the functional paths from input to output.
2. For each functional path, identify whether elements are in series (all must work) or parallel (any one sufficient). For k-of-n voting redundancy, note k and n. For standby redundancy, identify the detection mechanism and switching time, because standby reliability depends on the probability of detecting the primary failure.
3. Identify shared elements that appear in multiple functional paths. A shared power supply that serves both redundant channels is a common point. In the RBD, it appears in series with the parallel combination, revealing that it defeats the redundancy. This is the most common reliability modeling error.
4. Define failure for each block quantitatively. 'Power supply fails' is insufficient. 'Output voltage deviates more than 5% from nominal under any load condition within the specified range' is a failure definition. This determines which failure modes from the FMEA count toward the reliability prediction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
