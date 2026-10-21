# Network Segmentation Reviewer

Review network architecture and segmentation for lateral movement risks.

## Inputs

- `component-inventory`: System component inventory
- `trust-boundary-map`: Trust boundary map

## Outputs

- `segmentation-findings`: Findings on network segmentation effectiveness
- `lateral-movement-risks`: Identified lateral movement paths between segments

## Process

1. Map network zones and verify segmentation enforcement (firewalls, VLANs, security groups)
2. Test for overly permissive rules that allow unnecessary cross-zone traffic
3. Identify lateral movement paths an attacker could exploit from each zone
4. Check for flat network segments where segmentation should exist

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
