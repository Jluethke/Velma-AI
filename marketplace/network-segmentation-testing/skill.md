# Network Segmentation Testing

Test network segmentation controls by attempting to cross trust boundaries between defined network zones.

## Inputs

- `lateral-movement-paths`: Observed lateral movement paths
- `host-inventory`: Complete host inventory

## Outputs

- `segmentation-findings`: Segmentation failures and bypass paths
- `firewall-rule-gaps`: Firewall rules that allow unintended cross-zone traffic

## Process

1. Test connectivity between network zones (production, development, DMZ, management).
2. Identify firewall rules that allow broad or unnecessary cross-zone access.
3. Test VLAN hopping and other layer-2 segmentation bypasses.
4. Verify that management networks are isolated from user and production networks.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
