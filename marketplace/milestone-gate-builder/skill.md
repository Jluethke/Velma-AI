# Milestone Gate Builder

Build gates at each milestone: what must be true to pass, what happens if it fails, and who makes the go/no-go decision.

## Inputs

- `outcome-milestones`: The outcome milestones with verification methods
- `initiative-description`: The initiative context

## Outputs

- `milestone-gates`: For each milestone: the pass criteria, the fail criteria, the remediation plan for a fail, and the go/no-go decision maker
- `gate-schedule`: The scheduled dates for each gate review, with the preparation steps and the required attendees

## Process

1. For each milestone, define the pass criteria: what specific conditions must be met? All of them, not just some. A partial pass is a fail with asterisks.
2. Define the fail criteria: what specific conditions indicate the milestone is not met? Include the boundary cases: is 90% of tests passing a pass or a fail?
3. Define the remediation plan: if the gate fails, what happens? Options: rework until the gate passes (with a deadline), proceed with risk accepted (the decision maker acknowledges the gap), or re-scope (remove the failing component and adjust downstream).
4. Assign the go/no-go decision maker. This person reviews the evidence and makes the call. It should not be the project manager (who has an incentive to say go) but a stakeholder or quality owner.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
