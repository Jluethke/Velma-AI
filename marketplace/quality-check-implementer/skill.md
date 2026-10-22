# Quality Check Implementer

Implement automated quality checks in the data pipeline.

## Inputs

- `quality-rules`: Quality rules to implement
- `pipeline-config`: Current pipeline configuration

## Outputs

- `check-implementation`: Automated quality checks integrated into the pipeline
- `check-schedule`: When each check runs

## Process

1. Implement each rule as an automated check (Great Expectations, dbt tests, custom SQL).
2. Configure checks to run at ingestion, transformation, and load stages.
3. Set pass/fail thresholds and warning thresholds.
4. Test each check against known good and known bad data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
