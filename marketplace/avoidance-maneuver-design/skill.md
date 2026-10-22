# Avoidance Maneuver Design

Design the avoidance burn, place it ahead of closest approach, and re-screen the new orbit.

## Inputs

- `maneuver_decision`: Confirmed decision to maneuver.
- `close_approach_data`: Geometry that sets the most efficient burn direction.

## Outputs

- `avoidance_maneuver`: Burn direction, magnitude, and timing.
- `post_maneuver_ephemeris`: Predicted orbit after the maneuver for re-screening.

## Process

1. An along-track burn is the most efficient way to open miss distance: the along-track separation grows across each orbit after the burn, so a few cm/s applied one to three orbits before closest approach typically yields kilometers of separation.
2. A radial burn opens cross-track or radial separation quickly and suits a short lead time, at higher delta-v per meter of separation.
3. Place the burn at least one orbit before the time of closest approach so the separation has time to accumulate.
4. Keep the burn small to limit the disturbance to the mission orbit, and plan a return-to-station maneuver if the orbit must be restored.
5. Propagate the post-maneuver orbit and re-screen it against the catalog to confirm the burn does not create a new conjunction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
