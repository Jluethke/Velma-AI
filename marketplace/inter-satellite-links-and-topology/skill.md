# Inter Satellite Links And Topology

Design the inter-satellite link topology for relay, latency, and pointing.

## Inputs

- `walker_pattern`: Geometry that sets link ranges and visibility.
- `plane_phasing`: Phasing that affects cross-plane link geometry.
- `service_area`: Area that drives the ground-relay versus cross-link trade.

## Outputs

- `isl_topology`: Which satellites link to which, intra-plane and inter-plane.
- `network_latency`: End-to-end latency across the mesh.
- `link_pointing`: Pointing range and rate for cross-links.

## Process

1. Intra-plane links between neighbors in the same plane hold a near-constant range and are the simplest to maintain.
2. Inter-plane cross-links vary in range and pointing as planes rotate relative to each other, and the counter-rotating seam in a Star pattern can break cross-links there.
3. Optical inter-satellite links carry multi-gigabit rates over thousands of kilometers but need fine beam pointing and acquisition.
4. Trade ground-relay against inter-satellite relay: cross-links cut latency and reduce ground-station count but add pointing hardware and routing complexity.
5. Size the pointing range and slew rate for the worst cross-plane geometry, and define a mesh routing scheme that survives a single satellite outage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
