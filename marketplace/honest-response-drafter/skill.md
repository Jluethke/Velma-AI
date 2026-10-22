# Honest Response Drafter

Write the honest response to each real concern. An honest response acknowledges the concern, provides evidence, and does not pretend the cost is zero. If the concern is valid, say so and explain how you mitigate it.

## Inputs

- `concern-pairs`: Stated objection paired with real concern
- `proposal-description`: The proposal, so responses stay grounded in what is actually being proposed

## Outputs

- `response-map`: For each real concern: the honest response, the evidence supporting it, and the residual risk if any
- `unresolvable-concerns`: Concerns that cannot be addressed honestly, which become negotiation points or deal-breakers

## Process

1. For each real concern, write a response that starts with acknowledgment: 'You are right that this adds workload to your team.'
2. Follow with evidence: data, precedent, or a structural mitigation (not a promise). 'The pilot showed 12 hours per week, and we staff a dedicated resource for the first 90 days.'
3. Name the residual risk honestly. 'There is still a chance the migration takes longer than estimated. Here is the fallback plan.'
4. If a concern cannot be resolved, flag it as a negotiation point. Do not pretend it is resolved when it is not.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
