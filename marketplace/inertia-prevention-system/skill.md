# Inertia Prevention System

Prevent new sunk cost traps from forming. Every new commitment gets a review date. Every auto-renewal gets a decision checkpoint.

## Inputs

- `termination-plan`: The terminations being executed
- `total-savings`: The resources freed

## Outputs

- `commitment-review-calendar`: A calendar of review dates: every commitment reviewed at least annually, with the review checklist
- `new-commitment-rules`: Rules for new commitments: every new commitment must have a defined review date, a success metric, and a termination trigger

## Process

1. For every surviving commitment, set an annual review date. At the review, re-ask: knowing what I know now, would I start this today?
2. For every auto-renewal commitment, set a reminder 30 days before renewal. The reminder forces an active decision to continue or cancel.
3. For every new commitment going forward, require three things before starting: a defined review date, a measurable success metric, and a termination trigger (the condition under which you will stop).
4. Run the full sunk cost elimination audit annually. Commitments accumulate like barnacles. Regular scraping keeps the hull clean.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
