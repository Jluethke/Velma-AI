# Ad Delegation Checker

Check for unconstrained and constrained delegation misconfigurations.

## Inputs

- `account-inventory`: Accounts and computer objects
- `domain-structure`: Domain structure and trusts

## Outputs

- `delegation-findings`: Accounts with unconstrained, constrained, or resource-based constrained delegation
- `delegation-risk-assessment`: Risk rating for each delegation configuration

## Process

1. Query for all objects with unconstrained delegation enabled
2. Query for objects with constrained delegation and their allowed target services
3. Check for resource-based constrained delegation configurations
4. Assess whether each delegation setting creates an exploitable path to high-value targets

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
