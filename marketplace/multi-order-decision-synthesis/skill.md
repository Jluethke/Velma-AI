# Multi Order Decision Synthesis

Synthesize the full consequence map across all three orders and choose the option with the best total trajectory, not just the best immediate effect.

## Inputs

- `first-order-consequences`: First-order effects
- `second-order-consequences`: Second-order effects
- `third-order-effects`: Third-order effects
- `feedback-loops`: Identified feedback loops

## Outputs

- `option-trajectories`: For each option: the overall trajectory across all three orders (improving over time, degrading over time, or stable)
- `recommended-option`: The option with the best multi-order trajectory, with the rationale based on the analysis

## Process

1. For each option, assess the overall trajectory: does it get better over time (positive second and third-order effects outweigh negative first-order), or worse over time (positive first-order but negative downstream)?
2. The best option is often the one with the best trajectory, not the best first-order effect. An option with a slightly painful first-order effect but strong positive second and third-order effects is usually the right choice.
3. Conversely, avoid options with great first-order effects but degrading trajectories. These feel good now and create problems later.
4. Make the decision and record your analysis. The analysis is valuable not only for this decision but as a reference for future similar decisions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
