# Compliance Gap Identifier

Identify missing or partially implemented controls and classify the gap type.

## Inputs

- `control-mapping`: Control-to-requirement mapping
- `coverage-summary`: Coverage summary for prioritization

## Outputs

- `gap-inventory`: All identified gaps with classification (missing, partial, ineffective)
- `gap-evidence-list`: Evidence or lack thereof for each gap

## Process

1. Flag all requirements with no mapped control as 'missing'
2. Flag requirements with partial coverage and document what is incomplete
3. Identify controls that exist on paper but are not operationally effective
4. Classify each gap by type: policy, process, technology, or people

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
