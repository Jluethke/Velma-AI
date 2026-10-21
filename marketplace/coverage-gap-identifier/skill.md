# Coverage Gap Identifier

Identify gaps in detection coverage by mapping existing detections to the MITRE ATT&CK framework.

## Inputs

- `current-detection-inventory`: List of all active detection rules with their ATT&CK mappings
- `threat-priority-list`: Prioritized list of threat actors and techniques relevant to the environment

## Outputs

- `coverage-gaps`: List of ATT&CK techniques with no detection or weak detection
- `gap-priority-ranking`: Gaps ranked by threat relevance and exploitability

## Process

1. Map each existing detection rule to ATT&CK technique IDs
2. Overlay the threat priority list to identify high-risk techniques with no coverage
3. Rank gaps by the product of threat likelihood and detection difficulty
4. Select the top gap to build a detection for

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
