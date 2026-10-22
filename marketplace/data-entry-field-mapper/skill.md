# Data Entry Field Mapper

Define the field mapping and transformation rules from source to target.

## Inputs

- `source-inventory`: Data sources with format and field details
- `target-inventory`: Target systems with required fields and validation rules

## Outputs

- `field-mapping-rules`: Source-to-target field mapping with any transformation logic (format, concatenate, split, default)
- `unmapped-fields`: Source fields with no target and target fields with no source, requiring manual handling or defaults

## Process

1. Match source fields to target fields by name, meaning, and data type.
2. Define transformations where the formats differ (date formats, name splitting, unit conversion).
3. Identify target required fields that have no source and define default values or manual fill rules.
4. Document the complete mapping.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
