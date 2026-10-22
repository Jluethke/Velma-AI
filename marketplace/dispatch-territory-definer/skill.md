# Dispatch Territory Definer

Define the service territory and zones for dispatch.

## Inputs

- `service-area-map`: Geographic area to be served
- `demand-data`: Historical and projected service demand by area

## Outputs

- `zone-map`: Service territory divided into dispatch zones with boundaries
- `zone-profiles`: Profile for each zone (demand volume, travel times, crew requirements)

## Process

1. Divide the service area into zones based on geographic boundaries and demand density.
2. Estimate travel times between zones and within each zone.
3. Determine the crew count and skill mix needed per zone.
4. Document the zone map with boundaries and profiles.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
