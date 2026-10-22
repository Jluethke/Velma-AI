# Data Entry Validator

Validate each record before writing it to the target system.

## Inputs

- `field-mapping-rules`: Source-to-target mapping with transformations
- `entry-trigger`: Trigger configuration

## Outputs

- `validation-rules`: Pre-entry checks for each field (type, range, format, required, referential integrity)
- `rejection-handling`: What happens to records that fail validation (quarantine queue, alert, skip and log)

## Process

1. For each target field, define the validation rule (type check, range check, format pattern, not-null).
2. Add cross-field validations where business rules require it (e.g., end date after start date).
3. Define the handling for records that fail: quarantine for manual review, skip and log, or reject and alert.
4. Document the validation rules and rejection handling.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
