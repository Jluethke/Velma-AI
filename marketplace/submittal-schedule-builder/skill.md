# Submittal Schedule Builder

Prepare the submittal schedule from the project specifications.

## Inputs

- `project-specifications`: Project specification sections requiring submittals
- `project-schedule`: Construction schedule with procurement dates

## Outputs

- `submittal-schedule`: Schedule of all required submittals with due dates
- `submittal-responsibility-matrix`: Matrix of which subcontractor is responsible for each submittal

## Process

1. Extract all submittal requirements from the specifications.
2. Assign each submittal to the responsible subcontractor.
3. Set due dates based on procurement lead times and the construction schedule.
4. Distribute the schedule to all responsible parties.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
