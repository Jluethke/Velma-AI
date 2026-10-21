# Vuln Inventory Mapping

Inventory all known low and medium severity findings from prior assessments.

## Inputs

- `assessment-results`: Prior vulnerability assessment or pentest results
- `target-scope`: Systems and applications in scope

## Outputs

- `vuln-inventory`: Catalog of all low and medium findings with details
- `system-context`: Where each vulnerability exists in the architecture

## Process

1. Collect findings from all prior assessments and scans
2. Filter to low and medium severity items that remain open
3. Map each vulnerability to its location in the system architecture

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
