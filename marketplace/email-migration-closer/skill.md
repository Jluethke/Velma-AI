# Email Migration Closer

Complete the migration, decommission the old provider, and document the new state.

## Inputs

- `migration-log`: The migration log
- `validation-results`: The validation results

## Outputs

- `cutover-confirmation`: Confirmation that all sending is on the new provider with no remaining dependencies on the old
- `migration-report`: The complete migration report: what moved, what changed, lessons learned, new provider documentation

## Process

1. Confirm all active campaigns and automations are running on the new provider.
2. Verify no sends are going through the old provider.
3. Update all integrations to point to the new provider's API.
4. Decommission the old provider account (after a 30-day overlap for safety) and compile the migration report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
