# Evidence Collector

Collect evidence for each control from system configurations, logs, and documentation.

## Inputs

- `control-matrix`: Controls requiring evidence
- `evidence-requirements`: Specific evidence types per control

## Outputs

- `evidence-repository`: Organized collection of evidence per control
- `collection-gaps`: Controls where evidence is missing or insufficient

## Process

1. Collect screenshots, exports, and configuration files per control
2. Organize evidence by control number with timestamps
3. Identify controls where evidence is missing or stale
4. Document the collection process for audit trail

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
