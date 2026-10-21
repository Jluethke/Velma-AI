# Lateral Movement Segmentation Tester

Test network segmentation to assess how far ransomware could spread laterally.

## Inputs

- `critical-systems-list`: Critical systems and their network locations
- `network-architecture`: Network diagram and segmentation design

## Outputs

- `segmentation-test-results`: Which systems are reachable from a compromised workstation
- `lateral-movement-paths`: Paths from user workstation tier to server and backup tiers

## Process

1. From a standard workstation, test connectivity to all network segments
2. Identify which ports and services are reachable across segment boundaries
3. Test whether administrative protocols (RDP, SMB, WinRM) are restricted between tiers
4. Map the blast radius from a single compromised endpoint

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
