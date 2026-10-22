# Change Record Designer

Design the change record schema.

## Inputs

- `change-domains`: What types of changes to track (code, process, policy, infrastructure)
- `existing-change-process`: Current change management practices

## Outputs

- `change-record-schema`: Fields for each change entry (what, who, when, why, scope, expected impact)
- `change-template`: Blank change record template

## Process

1. Define the change record fields: what changed, who made the change, timestamp, rationale, expected impact, scope.
2. Add fields for downstream tracking: actual impact, incidents linked, rollback status.
3. Create the change record template.
4. Document the schema.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
