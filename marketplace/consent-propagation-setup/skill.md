# Consent Propagation Setup

Configure consent signals to propagate across all systems that process personal data.

## Inputs

- `consent-mechanism-spec`: The consent mechanism specification
- `collection-point-inventory`: All data collection points

## Outputs

- `propagation-architecture`: How consent signals flow from collection to all downstream systems
- `consent-management-document`: The complete consent management setup document

## Process

1. Map the consent signal flow from the collection point to each downstream system (CRM, email platform, analytics, advertising).
2. Configure each system to check consent status before processing data for non-essential purposes.
3. Set up the consent change workflow: when a user revokes consent, trigger the appropriate actions in each system.
4. Document the consent management setup for audit and compliance review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
