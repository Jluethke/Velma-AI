# Master Timeline Producer

Produce the master timeline document with evidence references and confidence ratings.

## Inputs

- `ttp-mapped-timeline`: TTP-annotated timeline
- `gap-analysis`: Gap and anomaly analysis
- `attack-phases`: Identified attack phases

## Outputs

- `master-timeline`: The final master timeline with all annotations
- `timeline-summary`: Executive summary of the incident timeline

## Process

1. Format the timeline with source references for each entry
2. Assign confidence ratings based on corroboration across sources
3. Write the executive summary of the attack sequence
4. Include the gap analysis and its implications

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
