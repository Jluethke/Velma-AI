# Caller Journey Mapper

Map the caller journey from entry to resolution for each call type.

## Inputs

- `call-types`: List of call types the IVR should handle (billing, support, sales, etc.)
- `call-volume-data`: Volume and distribution of calls by type

## Outputs

- `caller-journeys`: Journey maps for each call type from dial-in to resolution
- `routing-requirements`: Where each call type should land (queue, agent group, self-service)

## Process

1. List the call types and their percentage of total volume.
2. Map each call type from the moment the caller dials in to resolution or transfer.
3. Identify which calls can be fully self-served versus those requiring an agent.
4. Document the routing destination for each call type.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
