# Records Schedule Definer

Define the records retention schedule with retention periods, disposition methods, and access levels.

## Inputs

- `record-types`: List of record types the organization produces or receives
- `legal-requirements`: Applicable retention laws and regulations

## Outputs

- `retention-schedule`: Schedule mapping each record type to its retention period and disposition method
- `access-matrix`: Matrix defining access levels (public, restricted, exempt) for each record type

## Process

1. Inventory all record types by department and function.
2. Map each record type to the applicable legal retention requirement.
3. Assign disposition methods (archive, destroy, transfer) for each type.
4. Define access levels based on legal exemptions and operational needs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
