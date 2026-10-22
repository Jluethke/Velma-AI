# Report Schedule Planner

Define the generation and distribution schedule for each report.

## Inputs

- `report-catalog`: Catalog of recurring reports
- `automation-candidates`: Reports to automate

## Outputs

- `report-schedule`: Schedule for each report (generation time, distribution time, timezone)
- `data-source-map`: Map of each report to its data source and query

## Process

1. Set the generation time for each report (allow enough lead time for data to be complete).
2. Set the distribution time (recipients expect the report by a specific hour).
3. Map each report to its data source and the query or pipeline that produces it.
4. Handle timezone differences for global teams.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
