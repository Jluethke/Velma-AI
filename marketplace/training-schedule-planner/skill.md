# Training Schedule Planner

Define the training schedule, balancing coverage depth with team availability and sprint commitments.

## Inputs

- `training-modules`: Selected training modules mapped to vulnerability classes
- `team-roster`: List of developers with roles and languages used

## Outputs

- `training-schedule`: Calendar of training sessions with topics, attendees, and time allocations
- `schedule-dependencies`: Prerequisites and ordering constraints between modules

## Process

1. Order modules from foundational to advanced based on prerequisite dependencies.
2. Allocate time per module based on complexity and hands-on lab duration.
3. Schedule sessions around sprint commitments and team availability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
