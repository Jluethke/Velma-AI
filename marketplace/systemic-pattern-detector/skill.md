# Systemic Pattern Detector

Look across multiple incidents for shared conditions. If the same conditions appear in multiple incidents, they are systemic weaknesses, not incident-specific factors.

## Inputs

- `condition-fixes`: Conditions fixed from this incident
- `condition-map`: Full condition map from this incident

## Outputs

- `systemic-conditions`: Conditions that have appeared in more than one incident, indicating a systemic weakness
- `systemic-remediation-priority`: The systemic conditions ranked by how many incidents they contributed to

## Process

1. Compare this incident's condition map to previous incidents (if available). Look for conditions that appear in multiple incidents.
2. Conditions that appear repeatedly are systemic: they are features of the organization, not accidents of the moment.
3. Rank systemic conditions by the number of incidents they contributed to. The top-ranked condition is the highest-leverage fix.
4. A systemic fix may be expensive (restructuring, technology change, policy change), but it prevents an entire class of incidents, not just one.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
