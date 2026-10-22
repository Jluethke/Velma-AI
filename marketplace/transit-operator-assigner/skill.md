# Transit Operator Assigner

Assign operators to runs and publish the schedule.

## Inputs

- `vehicle-blocks`: Vehicle assignments
- `fleet-requirement`: Fleet requirement

## Outputs

- `operator-roster`: Operator assignments with work rules compliance (spread time, break requirements)
- `published-schedule`: Published transit schedule for riders and operations

## Process

1. Build operator runs from vehicle blocks, respecting labor agreement rules (max spread, minimum break, overtime limits).
2. Assign operators to runs based on seniority, qualifications, and availability.
3. Publish the internal operations schedule and the public rider schedule.
4. Compile the complete transit scheduling document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
