# Bounty Platform Selector

Evaluate and select the bug bounty platform (managed service or self-hosted).

## Inputs

- `program-scope`: Program scope
- `reward-schedule`: Reward schedule and budget

## Outputs

- `platform-selection`: Selected platform with rationale
- `platform-configuration`: Configuration requirements for the chosen platform

## Process

1. Compare managed platforms (HackerOne, Bugcrowd, Intigriti) against self-hosted options
2. Evaluate by researcher pool size, triage support, cost structure, and integration capabilities
3. Select the platform that fits budget and maturity level
4. Document the configuration needed (SSO, ticketing integration, payment processing)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
