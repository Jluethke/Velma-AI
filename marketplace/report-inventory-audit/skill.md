# Report Inventory Audit

Inventory all recurring reports and their current recipients.

## Inputs

- `department-list`: List of departments that receive recurring reports
- `current-reports`: Known recurring reports and their delivery methods

## Outputs

- `report-catalog`: Catalog of all recurring reports with frequency, recipients, data sources, and format
- `automation-candidates`: Reports that are currently manual and could be automated

## Process

1. Survey each department to identify all recurring reports they produce or receive.
2. For each report, record: name, frequency, recipients, data source, current delivery method, format.
3. Flag reports that are produced manually as automation candidates.
4. Flag reports with overlapping content for potential consolidation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
