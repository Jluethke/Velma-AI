# Triage Queue Reporter

Produce the triaged ticket queue report with distribution metrics.

## Inputs

- `acknowledged-tickets`: Fully triaged and acknowledged tickets
- `routing-exceptions`: Tickets requiring manual routing

## Outputs

- `triage-report`: Summary of triaged tickets by category, severity, and team
- `exception-list`: List of unrouted tickets needing attention

## Process

1. Count tickets by category, severity, and assigned team.
2. Calculate average triage time.
3. List all routing exceptions with reasons.
4. Produce the triage queue report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
