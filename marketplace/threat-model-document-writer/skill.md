# Threat Model Document Writer

Compile all findings into the final threat model document.

## Inputs

- `architecture-diagram`: Component and data flow diagram
- `trust-boundary-map`: Diagram with trust boundaries
- `risk-matrix`: Visual risk matrix
- `remediation-plan`: Prioritized remediation actions

## Outputs

- `threat-model-document`: Complete threat model document with all sections
- `executive-summary`: One-page summary of critical findings and next steps

## Process

1. Assemble the document with architecture, trust boundaries, threat catalog, risk matrix, and remediation plan
2. Write the executive summary highlighting the top five risks and their status
3. Include appendices with full threat catalog and attack trees
4. Set the review cadence (re-run threat model when architecture changes)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
