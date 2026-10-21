# Control Measure Recommender

Recommend control measures based on the identified source and mode of transmission.

## Inputs

- `study-results`: Analytical results identifying the source
- `incubation-estimate`: Estimated incubation period

## Outputs

- `control-recommendations`: Specific actions to stop transmission (recall, closure, prophylaxis, isolation)
- `monitoring-plan`: Plan to monitor the effect of interventions on case counts

## Process

1. Match the identified source to the appropriate intervention (remove source, interrupt transmission, protect susceptibles)
2. Prioritize actions by urgency and feasibility
3. Define success criteria (declining case counts, negative environmental samples)
4. Establish the monitoring and follow-up schedule

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
