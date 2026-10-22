# Event Order Processor

Process the banquet event order and extract operational requirements.

## Inputs

- `event-order`: Signed event order with menu, setup, AV, and timing
- `venue-specifications`: Room dimensions, capacity, and equipment available

## Outputs

- `operational-requirements`: Extracted setup, menu, staff, and AV requirements
- `event-timeline`: Minute-by-minute event timeline

## Process

1. Parse the event order for all service requirements.
2. Map the timeline from setup through breakdown.
3. Identify any requirements not covered by in-house resources.
4. Confirm all details with the event planner.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
