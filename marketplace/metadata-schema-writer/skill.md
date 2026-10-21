# Metadata Schema Writer

Write structured metadata following a standard schema (Dublin Core, DataCite, or domain-specific) for each dataset.

## Inputs

- `file-inventory`: File catalog with descriptions
- `metadata-standard`: Which schema to follow (Dublin Core, DataCite, DDI, EML)

## Outputs

- `metadata-records`: Structured metadata file for each dataset
- `metadata-validation`: Validation report confirming compliance with the chosen schema

## Process

1. Fill in required fields: title, creator, date, description, subject, format, rights.
2. Add recommended fields: spatial coverage, temporal coverage, methodology, funding.
3. Validate each record against the schema.
4. Fix any validation errors and re-check.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
