# Review Aggregator Anonymizer

Aggregate and anonymize the 360 review results for each participant.

## Inputs

- `collected-reviews`: All completed review forms

## Outputs

- `anonymized-reports`: Individual reports with aggregated scores and anonymized comments
- `aggregate-patterns`: Organization-wide patterns by competency and role level

## Process

1. Aggregate ratings by competency and reviewer group (self, manager, peers, direct reports).
2. Anonymize comments by removing identifying information (names, specific events with small audiences).
3. Flag competencies where self-ratings diverge significantly from others' ratings.
4. Calculate organization-wide averages by competency and role level for benchmarking.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
