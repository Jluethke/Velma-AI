# Upstream Fix Designer

Design the upstream intervention so it prevents the problem from entering the causal chain. The fix must be structural (built into the process), not behavioral (relying on people to remember).

## Inputs

- `selected-intervention`: The chosen intervention point
- `causal-chain`: Context about how the problem propagates

## Outputs

- `intervention-design`: The structural change that breaks the causal chain, including how it will be implemented
- `verification-method`: How to confirm the intervention is working (leading indicator, not lagging)

## Process

1. Design the fix as a change to the process, system, or environment, not as a reminder, checklist, or training. People forget; systems do not.
2. If the root cause is a missing input, add a validation gate that blocks progress until the input is present.
3. If the root cause is a skill gap, add a constraint that prevents the action from being done incorrectly (poka-yoke).
4. Define a leading indicator that shows the intervention is working before problems would have surfaced.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
