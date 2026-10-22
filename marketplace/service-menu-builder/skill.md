# Service Menu Builder

Define the service menu including services, durations, pricing tiers, and which providers perform each service.

## Inputs

- `business-type`: Type of salon or spa (hair, nails, massage, full-service)
- `provider-list`: List of staff with their skills and certifications

## Outputs

- `service-menu`: Complete service menu with names, durations, prices, and assigned providers
- `provider-service-matrix`: Matrix mapping each provider to the services they can perform

## Process

1. List all services the business will offer, grouped by category (cut, color, treatment, etc.).
2. For each service, set the duration, price, and any add-on options.
3. Map each provider to the services they are qualified to perform.
4. Review the menu for pricing consistency and gap coverage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
