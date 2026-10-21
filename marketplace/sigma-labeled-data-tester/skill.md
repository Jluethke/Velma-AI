# Sigma Labeled Data Tester

Test the rule against labeled datasets containing both attack and benign activity.

## Inputs

- `siem-query`: Rule in target SIEM format
- `conversion-notes`: Platform-specific adjustments

## Outputs

- `test-results`: Detection rate on attack data and false positive rate on benign data
- `sample-matches`: Example matches from both attack and benign datasets

## Process

1. Run the query against a dataset of known attack activity to measure detection rate
2. Run the query against a dataset of normal business activity to measure false positive rate
3. Inspect sample matches to verify the rule triggers on the expected events

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
