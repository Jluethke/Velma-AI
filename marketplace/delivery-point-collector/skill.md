# Delivery Point Collector

Collect and geocode all delivery or service points for the routing period.

## Inputs

- `delivery-orders`: Orders or service requests to be routed
- `service-area`: Geographic boundaries of the service area

## Outputs

- `geocoded-points`: All delivery points with coordinates and service requirements
- `point-constraints`: Per-point constraints (time windows, access restrictions, special equipment)

## Process

1. Extract delivery addresses from the orders.
2. Geocode each address and validate the coordinates.
3. Record per-point constraints (time windows, vehicle type requirements, unloading time).
4. Cluster points by geographic proximity for initial grouping.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
