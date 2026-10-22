# Friction Remover

Remove friction from the highest-drop step. Then move to the next.

## Inputs

- `highest-drop-step`: The activation bottleneck
- `step-conversion-rates`: The baseline rates

## Outputs

- `friction-diagnosis`: Why users drop at this step: confusion, too many required fields, unclear instructions, missing context, technical error
- `friction-fix-plan`: Specific changes to reduce friction: simplify, remove optional steps, add guidance, fix errors, reduce time required

## Process

1. Diagnose the friction: observe users attempting the step (screen recordings, user testing), survey users who dropped, and analyze the interaction data (time on step, error rates, back-button clicks).
2. Categorize the friction: complexity (too many choices or steps), confusion (unclear what to do), effort (requires too much input), technical (errors or slow loading), or motivation (user does not see why this step is needed).
3. Fix the dominant friction type: simplify choices, clarify instructions, reduce required input, fix technical issues, or show the user why this step leads to value.
4. Measure the impact: A/B test or before/after. Improve the step, measure the new conversion rate, and calculate the impact on overall activation rate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
