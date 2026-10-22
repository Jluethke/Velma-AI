# Quality Rule Definer

Define quality rules for completeness, uniqueness, freshness, and conformance.

## Inputs

- `baseline-profile`: Data quality baselines
- `quality-objectives`: Business requirements for data quality

## Outputs

- `quality-rules`: Defined quality rules with thresholds
- `rule-priority`: Rules ranked by business impact

## Process

1. Define completeness rules (null rate thresholds per column).
2. Define uniqueness rules (duplicate detection on key columns).
3. Define freshness rules (maximum staleness per dataset).
4. Define conformance rules (schema, format, range, referential integrity).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
