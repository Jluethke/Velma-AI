# Zero Base Restart

Strip the process to zero and define the absolute minimum: what is the fewest steps that produce an acceptable outcome?

## Inputs

- `actual-process`: How the process really runs
- `compliance-rate`: Which steps are actually followed

## Outputs

- `essential-steps`: The 2-4 steps that are absolutely required for an acceptable outcome (if any of these are skipped, the outcome is unacceptable)
- `removed-steps`: Steps removed from the process, each with the reason (never followed, no impact when skipped, redundant with another step)

## Process

1. Start from zero: no steps. Ask: what is the first thing that absolutely must happen for an acceptable outcome? That is step 1.
2. Add steps one at a time, only if the outcome would be unacceptable without them. Stop adding when the outcome is acceptable. You will end up with 2-4 essential steps for most processes.
3. For each removed step, document why it was removed. This prevents someone from adding it back later without understanding the analysis.
4. The minimal process should feel uncomfortably lean. If it feels comfortable, you probably kept too many steps. Test it by running the minimal version 3-5 times before adding anything back.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
