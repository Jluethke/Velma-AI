# Email Migration Auditor

Audit the current state and plan what needs to migrate.

## Inputs

- `source-provider`: The current email service provider
- `target-provider`: The new email service provider
- `migration-reason`: Why the migration is happening (cost, features, deliverability, consolidation)

## Outputs

- `migration-inventory`: Everything that needs to migrate: lists, segments, templates, automations, integrations, historical data
- `risk-assessment`: Risks to deliverability, data integrity, and business continuity during migration

## Process

1. Inventory the source provider: subscriber lists, segments, custom fields, tags.
2. Inventory templates, automations (flows/sequences), and active campaigns.
3. Inventory integrations (CRM, ecommerce, analytics, API connections).
4. Assess risks: deliverability impact of IP/domain warm-up, data loss, downtime, broken automations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
