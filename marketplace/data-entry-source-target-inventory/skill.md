# Data Entry Source Target Inventory

Identify the data sources (where data comes from) and targets (where data goes), including access methods and data formats.

## Inputs

- `current-manual-process`: Description of the current manual data entry process, including what is entered, from where, and into what
- `system-access-details`: API endpoints, file locations, or UI paths for source and target systems

## Outputs

- `source-inventory`: List of data sources with access method, format, and frequency of new data
- `target-inventory`: List of target systems with access method, required fields, and validation rules

## Process

1. List every source the manual process reads from (files, emails, web pages, other systems).
2. List every target the manual process writes to (databases, spreadsheets, SaaS platforms).
3. For each source and target, document the access method (API, file drop, screen entry) and data format.
4. Note any authentication or rate limiting constraints.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
