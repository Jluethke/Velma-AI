# Decision Schema Designer

Define the schema for a decision log entry.

## Inputs

- `organization-context`: Type of organization and decision domains
- `existing-processes`: Current decision-making processes in use

## Outputs

- `decision-schema`: Field definitions for each log entry (date, decision, context, alternatives, rationale, owner, outcome)
- `entry-template`: Blank entry template ready to fill

## Process

1. List the fields every entry must carry (date, decision, context, alternatives considered, rationale, owner, expected outcome).
2. Add optional fields for tags, urgency, and reversibility.
3. Define the data types and validation rules for each field.
4. Produce the schema document and a blank entry template.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
