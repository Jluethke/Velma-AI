# Deprecation Candidate Identifier

Identify endpoints that should be deprecated and assess the impact.

## Inputs

- `api-usage-data`: Which endpoints are called, by whom, and how often
- `deprecation-reasons`: Why each endpoint is being considered for deprecation

## Outputs

- `deprecation-candidates`: Endpoints to deprecate with usage data and impact assessment
- `affected-consumers`: Which consumers use each endpoint and how to reach them

## Process

1. Pull usage data for the candidate endpoints: request volume, unique consumers, last 90 days trend.
2. For each endpoint, identify every consumer that has called it recently.
3. Assess the impact: how many consumers, how critical is their usage, is there an alternative.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
