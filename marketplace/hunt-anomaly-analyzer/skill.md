# Hunt Anomaly Analyzer

Analyze the hunt results to identify anomalies, suspicious patterns, and potential threats.

## Inputs

- `raw-hunt-results`: Query results from all data sources
- `execution-log`: Log of queries and data coverage

## Outputs

- `findings-list`: List of anomalies and suspicious patterns with supporting evidence
- `false-positive-notes`: Benign explanations identified during analysis for future reference

## Process

1. Filter results to remove known benign activity and approved exceptions
2. Group remaining results by pattern: same technique, same actor, or same target
3. Investigate each group to determine if it represents a real threat or a benign anomaly
4. Document false positive patterns for future hunt refinement

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
