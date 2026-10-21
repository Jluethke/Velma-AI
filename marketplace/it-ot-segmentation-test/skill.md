# It Ot Segmentation Test

Test network segmentation between IT and OT environments.

## Inputs

- `ics-network-map`: Network zones and firewall rules
- `credential-findings`: Credentials that may allow cross-zone access

## Outputs

- `segmentation-findings`: Gaps in IT/OT network segmentation
- `lateral-movement-paths-ics`: Paths from IT network into OT zones

## Process

1. Test firewall rules between IT and OT zones for unauthorized paths
2. Check for dual-homed systems bridging IT and OT networks
3. Test remote access solutions (VPN, jump hosts) for OT environment access
4. Verify that data diodes and DMZ architectures enforce one-way data flow where specified

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
