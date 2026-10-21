# Ransomware Evidence Capture

Preserve volatile and non-volatile evidence from affected systems before recovery begins.

## Inputs

- `isolation-log`: Record of isolated systems
- `scope-assessment`: List of affected systems to capture evidence from

## Outputs

- `evidence-inventory`: Cataloged and hashed evidence items
- `memory-dumps`: Memory captures from affected systems

## Process

1. Capture memory from affected systems before powering down (using tools like WinPmem or LiME)
2. Image affected disks or create forensic copies of encrypted volumes
3. Collect relevant logs (event logs, EDR telemetry, firewall logs)
4. Hash all collected evidence and record in a chain-of-custody log

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
