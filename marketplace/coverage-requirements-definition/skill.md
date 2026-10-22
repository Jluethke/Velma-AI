# Coverage Requirements Definition

Define the coverage area, revisit, elevation mask, and fold requirements the constellation must meet.

## Inputs

- `mission_coverage_goals`: Continuous or revisit coverage and the service type.
- `service_area`: Global, regional, or latitude-banded area to cover.
- `quality_of_service`: Latency, availability, and n-fold coverage needs.

## Outputs

- `coverage_requirements`: Coverage type, area, and quality targets.
- `elevation_mask`: Minimum user elevation angle for a usable link.
- `revisit_targets`: Maximum gap and mean revisit time for revisit missions.

## Process

1. Distinguish continuous coverage (every point always in view of at least one satellite) from revisit coverage (each point seen within a bounded gap).
2. Set the minimum user elevation angle, typically 10 to 25 deg, below which terrain and atmosphere make the link unusable.
3. Define the fold requirement: navigation needs at least four satellites in view for a position fix, while communications may need one or two.
4. Specify latency and availability targets that will later drive altitude and inter-satellite links.
5. Bound the latitude range to serve, since polar coverage and equatorial coverage lead to different orbit choices.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
