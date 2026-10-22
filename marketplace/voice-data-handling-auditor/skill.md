# Voice Data Handling Auditor

Audit how voice data is stored, accessed, and disposed of.

## Inputs

- `recording-audit`: Recording compliance findings
- `consent-gaps`: Identified consent gaps

## Outputs

- `data-handling-audit`: Audit of voice data storage (encryption, access controls, retention, disposal)
- `pii-handling-findings`: Findings on how PII in call recordings and transcripts is handled

## Process

1. Audit the storage: where recordings are stored, encryption at rest and in transit.
2. Audit the access controls: who can access recordings, logging of access.
3. Audit the retention: how long recordings are kept, automatic deletion schedule.
4. Audit the PII handling: redaction in transcripts, PII in metadata, deletion upon request.
5. Document the findings.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
