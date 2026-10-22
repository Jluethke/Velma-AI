# Email Migration Executor

Execute the migration and validate each phase.

## Inputs

- `migration-plan`: The step-by-step plan
- `warmup-plan`: The warm-up schedule

## Outputs

- `migration-log`: Log of each migration step with status, issues encountered, and resolutions
- `validation-results`: Validation results for each migrated component (list counts match, templates render, automations fire)

## Process

1. Execute DNS changes (SPF, DKIM for new provider). Verify authentication passes.
2. Export and import subscriber lists. Verify counts match and custom fields mapped correctly.
3. Recreate templates in the new provider. Test rendering.
4. Recreate automations and test each trigger fires correctly.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
