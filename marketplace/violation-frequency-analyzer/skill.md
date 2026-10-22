# Violation Frequency Analyzer

Track violation frequency by guardrail and identify the most-triggered rules.

## Inputs

- `enforcement-log-schema`: Schema for event records
- `guardrail-inventory`: List of all guardrails

## Outputs

- `frequency-report`: Violation frequency by guardrail, time period, and actor
- `top-triggered-list`: Ranked list of most-triggered guardrails

## Process

1. Count enforcement events per guardrail per time period.
2. Rank guardrails by trigger frequency.
3. Break down by actor, time of day, and context.
4. Produce the frequency report and top-triggered list.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
