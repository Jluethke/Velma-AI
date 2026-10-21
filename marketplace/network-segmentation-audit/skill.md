# Network Segmentation Audit

Audit network configurations including VPCs, security groups, NACLs, and firewall rules for excessive exposure.

## Inputs

- `resource-inventory`: Inventory of all cloud resources
- `iam-findings`: IAM audit results for context

## Outputs

- `network-findings`: Network misconfigurations and exposure issues
- `open-ports-report`: Services exposed to the public internet

## Process

1. Map all VPCs, subnets, route tables, and peering connections.
2. Check security groups for rules allowing 0.0.0.0/0 on sensitive ports.
3. Identify resources in public subnets that should be private.
4. Verify that network segmentation isolates production from development.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
