# Mitigation Design Per Theme

For each high-probability failure theme, design a specific mitigation. The mitigation must be an action you can take now (before the failure happens), not a response plan for after it happens. The test: does this mitigation reduce the probability of the failure, or does it only reduce the damage after the failure occurs?

## Inputs

- `failure-themes`: The clustered failure themes
- `theme-frequency-ranking`: Themes ranked by convergence frequency

## Outputs

- `mitigation-plan`: For each top failure theme: the specific preventive action, who owns it, and the deadline
- `residual-risks`: Failure modes that cannot be fully mitigated, with their estimated probability and impact

## Process

1. Take the top 3 to 5 themes by frequency (or all themes above 2 independent hits).
2. For each theme, ask: 'What specific action, taken this week, would make this failure mode less likely?'
3. Reject mitigations that are response plans ('if X happens, we will Y'). Demand preventive actions ('we will Z so X cannot happen').
4. Assign an owner and a deadline to each mitigation. Unowned mitigations do not happen.
5. For failure modes that cannot be prevented, name them as residual risks and estimate their probability and impact.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
