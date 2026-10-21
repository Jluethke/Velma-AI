# Lateral Movement Testing

Attempt lateral movement from compromised hosts to other network segments to test internal segmentation.

## Inputs

- `exploitation-results`: Compromised hosts and access levels
- `network-topology`: Network topology and segment boundaries

## Outputs

- `lateral-movement-paths`: Paths from initial compromise to other segments
- `credential-findings`: Credentials or tokens recovered during movement

## Process

1. From each compromised host, enumerate accessible network segments.
2. Test for credential reuse across systems.
3. Attempt to pivot through trust relationships (SSH keys, Kerberos tickets, cached credentials).
4. Document each hop in the lateral movement chain with timestamps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
