# Variation Source Identification

Catalog the sources of process variation affecting circuit performance, distinguish global from local effects, and quantify their magnitudes from process documentation.

## Inputs

- `process-documentation`: PDK documentation, process control monitor data, and foundry-provided variation statistics
- `circuit-schematic`: The circuit under analysis

## Outputs

- `variation-catalog`: Each variation source with its magnitude, spatial correlation, and which circuit parameters it affects
- `sensitivity-ranking`: Circuit parameters ranked by sensitivity to process variation

## Process

1. Global (inter-die) variations affect all devices on a die identically: Vt shift, tox variation, Leff variation, metal thickness. These cause all NMOS on a die to be simultaneously fast or slow. Magnitude: Vt variation is typically 30-60 mV (3-sigma) for standard devices.
2. Local (intra-die) mismatch: random dopant fluctuation, line edge roughness, oxide thickness granularity. These are independent between neighboring devices. Mismatch scales inversely with sqrt(W*L): sigma_Vt = Avt / sqrt(W*L), where Avt is 3-8 mV*um for modern processes.
3. Systematic variation: depend on layout context. STI stress changes mobility by 5-20% depending on distance to STI edge. Well proximity effect shifts Vt by 10-30 mV near well boundaries. Metal density affects CMP uniformity, changing wire thickness and resistance by 5-10%.
4. For each circuit performance parameter (gain, offset, bandwidth, delay), compute the sensitivity to each variation source. Use small-signal perturbation: delta_performance / delta_parameter * sigma_parameter gives the performance variation contribution from that source.
5. Rank the variation sources by their impact on the yield-limiting parameter. Typically for analog: Vt mismatch dominates offset, global Vt shift dominates speed, and systematic stress variations dominate gain asymmetry.
6. Document the complete variation catalog with magnitudes and correlations. This becomes the input to corner model selection and Monte Carlo simulation setup.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
