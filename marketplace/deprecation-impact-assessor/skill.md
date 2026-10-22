# Deprecation Impact Assessor

Assess the impact of deprecating an API feature or version.

## Inputs

- `deprecation-target`: What is being deprecated (endpoint, field, version, feature)
- `usage-data`: Current usage data for the target (consumers, request volume, growth trend)

## Outputs

- `impact-assessment`: Number of affected consumers, request volume at risk, and business impact estimate
- `migration-complexity`: Complexity assessment: is there a drop-in replacement, or does the consumer need to rewrite logic?

## Process

1. Pull usage data for the deprecation target: how many consumers, how many requests, trending up or down.
2. Identify the top consumers by volume and assess their likely migration effort.
3. Determine if a replacement exists and how different it is from the deprecated feature.
4. Estimate the migration complexity (drop-in replacement, minor changes, significant rewrite).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
