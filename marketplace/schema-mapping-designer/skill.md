# Schema Mapping Designer

Map source schemas to the target schema with transformation rules.

## Inputs

- `source-catalog`: Catalog of source systems and their schemas
- `target-schema`: Target data store schema or requirements

## Outputs

- `schema-mapping`: Source-to-target mapping with transformation rules
- `mapping-exceptions`: Fields that require special handling or business rules

## Process

1. Map each source field to its target field with data type conversions.
2. Define transformation rules for fields that require cleaning or enrichment.
3. Document business rules for derived fields and aggregations.
4. Flag fields with no direct mapping for resolution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
