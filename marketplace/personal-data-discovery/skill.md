# Personal Data Discovery

Locate all personal data belonging to the data subject across systems.

## Inputs

- `verified-request`: The validated request with confirmed identity
- `request-type`: The type of request being processed

## Outputs

- `data-inventory`: Complete inventory of the data subject's personal data across all systems
- `system-list`: List of systems containing the data subject's data

## Process

1. Query the data map to identify all systems that may contain the data subject's personal data.
2. Search each system for records matching the data subject's identifiers (email, name, account ID).
3. Compile the inventory of data found, organized by system and data category.
4. Flag any systems where data could not be searched automatically for manual review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
