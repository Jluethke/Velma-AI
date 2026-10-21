# Network Hardening Reporter

Produce the network device hardening report summarizing all changes and remaining items.

## Inputs

- `device-inventory`: Network devices that were hardened
- `disabled-ports-log`: Record of port changes

## Outputs

- `hardening-report`: Full network hardening report with findings and changes
- `exception-list`: List of items not hardened with justification

## Process

1. Compile all change logs from each hardening step
2. Run a configuration compliance check against the baseline
3. Document any exceptions with risk acceptance justification
4. Produce the final report with device-by-device status

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
