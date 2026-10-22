# Retainer Overage Handler

Handle situations where retainer hours are exceeded or scope changes are needed.

## Inputs

- `monthly-report`: Current utilization report
- `recommendations`: Adjustment recommendations

## Outputs

- `overage-resolution`: How the overage was handled (additional billing, scope adjustment, or hours added)
- `updated-terms`: Any changes to the retainer terms

## Process

1. When hours are exceeded, notify the client with the overage amount and cause.
2. Propose options: bill the overage at the agreed rate, add hours to the retainer, or reduce scope.
3. Get client approval for the chosen resolution.
4. Update the retainer tracking and terms if the allocation changes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
