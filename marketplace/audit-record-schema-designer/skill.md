# Audit Record Schema Designer

Specify the record schema for each audit entry.

## Inputs

- `auditable-events`: Events that produce audit records
- `audit-trigger-rules`: When audit entries are created

## Outputs

- `audit-record-schema`: Field definitions (who, what, when, where, before value, after value)
- `schema-validation-rules`: Validation rules for each field

## Process

1. Define the standard fields: actor, action, timestamp, resource, before-state, after-state, source IP, session ID.
2. Add compliance-specific fields as required.
3. Set validation rules (non-null actor, valid timestamp format, referential integrity).
4. Produce the schema and validation rules.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
