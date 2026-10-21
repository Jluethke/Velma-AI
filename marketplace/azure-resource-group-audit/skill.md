# Azure Resource Group Audit

Audit resource group configurations, network security groups, and resource exposure across subscriptions.

## Inputs

- `ad-object-inventory`: Enumerated directory objects from prior step
- `role-assignment-map`: RBAC assignments to guide access testing

## Outputs

- `resource-exposure-report`: Public endpoints and misconfigured NSG rules
- `subscription-resource-map`: Full map of resources across all subscriptions

## Process

1. List all subscriptions and resource groups accessible with test credentials
2. Enumerate network security group rules for overly permissive inbound access
3. Identify resources with public endpoints (public IPs, DNS records, load balancers)
4. Check for resources deployed outside approved regions or resource groups

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
