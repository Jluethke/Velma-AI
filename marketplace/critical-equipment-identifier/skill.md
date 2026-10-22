# Critical Equipment Identifier

Identify the critical equipment and the sensors needed to monitor it.

## Inputs

- `equipment-list`: The equipment to monitor
- `monitoring-goals`: What the monitoring should detect (failure, wear, efficiency)

## Outputs

- `sensor-plan`: Which sensors to install on which equipment (vibration, temp, pressure, flow)
- `criticality-ranking`: Equipment ranked by criticality and monitoring priority

## Process

1. List each piece of equipment and its failure modes.
2. For each failure mode, identify the sensor type that detects early signs.
3. Rank the equipment by criticality (production impact, safety, replacement cost).
4. Assign monitoring priority based on the ranking.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
