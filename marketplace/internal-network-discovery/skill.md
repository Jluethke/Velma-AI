# Internal Network Discovery

Discover live hosts, network topology, and broadcast services on the internal network.

## Inputs

- `engagement-scope`: Authorized network segments to scan
- `initial-position-report`: Starting position and network connectivity

## Outputs

- `internal-host-map`: Live hosts with open ports organized by network segment
- `broadcast-traffic-analysis`: Captured LLMNR, NBT-NS, mDNS, and WPAD broadcast traffic
- `network-topology-map`: Discovered VLANs, subnets, and routing paths

## Process

1. Perform ARP scanning and ping sweeps on authorized subnets
2. Capture and analyze broadcast traffic for LLMNR, NBT-NS, and mDNS responses
3. Map network segments, VLANs, and routing between zones
4. Identify high-value targets (domain controllers, file servers, databases)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
