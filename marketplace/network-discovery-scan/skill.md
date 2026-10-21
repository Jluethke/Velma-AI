# Network Discovery Scan

Discover live hosts, open ports, and network topology within the authorized scope.

## Inputs

- `network-scope`: Authorized IP ranges
- `engagement-rules`: Testing constraints

## Outputs

- `host-inventory`: List of live hosts with open ports
- `network-topology`: Observed network topology and segmentation boundaries

## Process

1. Run host discovery scans (ICMP, TCP SYN, ARP) across all in-scope ranges.
2. Perform port scans on discovered hosts (top 1000 TCP and UDP ports).
3. Map observed network topology including subnets, gateways, and VLANs.
4. Identify operating systems through TCP/IP fingerprinting.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
