# Disk Forensics Report Writer

Produce the disk forensics report with findings, evidence references, and chain of custody.

## Inputs

- `artifact-collection`: All extracted artifacts and evidence
- `hash-report`: Image integrity verification records
- `metadata-analysis`: Filesystem metadata analysis results

## Outputs

- `forensics-report`: The complete disk forensics report
- `evidence-index`: Index of all evidence items with hash values

## Process

1. Organize findings by category and chronological order
2. Write the analysis narrative with evidence references
3. Include hash verification and chain of custody records
4. Compile the evidence index with file paths and checksums

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
