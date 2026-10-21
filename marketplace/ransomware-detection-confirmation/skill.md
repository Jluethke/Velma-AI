# Ransomware Detection Confirmation

Detect and confirm that a ransomware incident is underway by analyzing alerts, file encryption patterns, and ransom notes.

## Inputs

- `alert-data`: Security alerts or user reports indicating possible ransomware
- `affected-system-info`: Hostname, IP, OS, and role of the affected system

## Outputs

- `confirmation-report`: Confirmed or ruled-out ransomware determination with evidence
- `ransomware-variant-id`: Identified ransomware family and variant if known

## Process

1. Review the alert or user report for ransomware indicators (encrypted files, ransom note, unusual extensions)
2. Check endpoint detection logs for process activity associated with encryption
3. Identify the ransomware variant using ransom note text, file extensions, or hash lookups
4. Document the confirmation with timestamps and evidence

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
