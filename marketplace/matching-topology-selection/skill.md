# Matching Topology Selection

Select the matching network topology based on the impedance transformation ratio, bandwidth requirement, and allowable complexity.

## Inputs

- `load-impedance-data`: Complex impedance across the band
- `smith-chart-position`: Normalized position on Smith chart
- `frequency-requirements`: Center frequency, bandwidth, return loss target

## Outputs

- `selected-topology`: The matching network topology: L-network, pi, T, quarter-wave transformer, multi-section, or other, with justification
- `q-budget`: The loaded Q of the matching network and resulting bandwidth, compared to the requirement

## Process

1. Calculate the impedance transformation ratio: ratio = max(R_load, R_source) / min(R_load, R_source). For ratios under 10:1, an L-network is usually sufficient. Above 10:1, consider pi or T networks.
2. For an L-network: two reactive elements. The loaded Q is fixed by the transformation ratio: Q = sqrt(ratio - 1). The bandwidth is approximately BW = f0/Q. If this bandwidth meets the requirement, use the L-network. It is the simplest.
3. There are 8 possible L-network configurations (series-shunt combinations of L and C). The correct one depends on which region of the Smith chart the load falls in. Use the constant-Q circles to identify the path.
4. For wider bandwidth than the L-network provides, use a pi-network (three elements) or T-network (three elements). These give independent control of Q. Lower Q means wider bandwidth but also lower selectivity.
5. For very broadband matching (octave or more), use multi-section quarter-wave transformers. Chebyshev taper gives equi-ripple response in the band. The number of sections sets the bandwidth-ripple trade-off.
6. For transmission line implementations above a few GHz, use distributed elements: open and short stubs, coupled lines, or stepped impedance transformers. Below 1 GHz, lumped elements are usually more practical.
7. Record the selected topology and the expected bandwidth. If the topology cannot meet the bandwidth with acceptable ripple, the specification may require revision.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
