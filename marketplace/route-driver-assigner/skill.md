# Route Driver Assigner

Assign validated routes to drivers and produce the route plan.

## Inputs

- `validated-routes`: Real-world validated routes
- `adjustment-notes`: Adjustment notes

## Outputs

- `driver-assignments`: Each route assigned to a specific driver and vehicle
- `optimized-route-plan`: Complete route plan with manifests, maps, and estimated schedules

## Process

1. Match routes to drivers based on location, vehicle type, and certifications.
2. Balance workload across drivers (hours, stops, distance).
3. Generate the route manifest for each driver (stop sequence, addresses, time windows, special instructions).
4. Distribute the route plan and confirm driver acknowledgment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
