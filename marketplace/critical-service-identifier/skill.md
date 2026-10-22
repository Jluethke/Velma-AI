# Critical Service Identifier

Identify critical IT services and their dependencies.

## Inputs

- `service-catalog`: IT service catalog or service list
- `business-impact-data`: Business impact if each service is unavailable

## Outputs

- `critical-services`: Ranked list of critical services
- `dependency-map`: Dependencies for each critical service

## Process

1. Rank services by business impact of downtime.
2. Identify the top tier of services that must be recovered first.
3. Map the infrastructure, application, and data dependencies for each.
4. Identify single points of failure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
