# Maintenance Task Definer

Define preventive maintenance tasks and intervals for each equipment class.

## Inputs

- `criticality-ranking`: Equipment criticality classes
- `equipment-registry`: Equipment details

## Outputs

- `pm-task-list`: Maintenance tasks with intervals for each equipment
- `spare-parts-list`: Required spare parts and consumables

## Process

1. Review manufacturer recommendations for each equipment type
2. Incorporate failure history and operator knowledge
3. Define tasks: inspection, lubrication, calibration, replacement
4. Set intervals based on operating hours, calendar time, or condition triggers

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
