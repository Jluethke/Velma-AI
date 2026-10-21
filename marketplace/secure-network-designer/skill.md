# Secure Network Designer

Design the network architecture with segmentation, access controls, and monitoring points.

## Inputs

- `trust-model`: Trust zones and boundaries
- `control-matrix`: Controls assigned to each zone and boundary

## Outputs

- `network-architecture`: Network diagram with VLANs, firewalls, load balancers, and monitoring taps
- `segmentation-rules`: Firewall rules and ACLs for each boundary

## Process

1. Define network segments aligned with trust zones
2. Place firewalls and access control points at trust boundaries
3. Design load balancing and high availability within each zone
4. Place monitoring taps and log collection points

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
