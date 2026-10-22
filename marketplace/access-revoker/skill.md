# Access Revoker

Revoke system access and collect company equipment.

## Inputs

- `employee-details`: Employee information
- `exit-interview-notes`: Exit interview completed

## Outputs

- `access-revocation-log`: Log of all revoked access
- `equipment-return-log`: List of returned equipment

## Process

1. Compile all systems the employee has access to
2. Revoke access on the last day (or immediately for involuntary departures)
3. Collect all company equipment (laptop, badges, keys)
4. Verify revocation across all systems

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
