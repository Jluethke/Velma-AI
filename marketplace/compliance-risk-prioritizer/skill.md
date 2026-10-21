# Compliance Risk Prioritizer

Prioritize compliance gaps by risk to the business and audit timeline.

## Inputs

- `gap-inventory`: All identified compliance gaps
- `target-framework`: Framework for understanding requirement severity

## Outputs

- `prioritized-gap-list`: Gaps ranked by risk and audit urgency
- `risk-heat-map`: Visual heat map of gap risk by framework domain

## Process

1. Score each gap by likelihood of exploitation and business impact if exploited
2. Factor in audit timeline: gaps that will be tested first get higher priority
3. Consider regulatory penalties and contractual obligations tied to each requirement
4. Rank the gaps into critical, high, medium, and low priority tiers

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
