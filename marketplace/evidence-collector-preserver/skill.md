# Evidence Collector Preserver

Collect and preserve digital evidence from affected systems following forensic standards.

## Inputs

- `incident-scope`: Systems, users, and timeframe to investigate
- `investigation-plan`: Priorities for evidence collection

## Outputs

- `evidence-inventory`: Catalog of all collected evidence with chain of custody records
- `preserved-artifacts`: Forensic images, log exports, and memory captures

## Process

1. Capture volatile evidence first: memory dumps, network connections, running processes
2. Export relevant logs from SIEM, EDR, authentication systems, and cloud audit trails
3. Create forensic disk images of affected systems where needed
4. Document the chain of custody for all collected evidence

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
