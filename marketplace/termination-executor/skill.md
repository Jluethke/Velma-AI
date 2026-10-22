# Termination Executor

Terminate the elimination candidates. For each: the termination method, the notice period, and the exit cost.

## Inputs

- `elimination-candidates`: The commitments flagged for elimination
- `commitment-list`: The full commitment details

## Outputs

- `termination-plan`: For each elimination candidate: the steps to terminate, the notice required, the exit cost (early termination fees, cleanup), and the savings per period after termination
- `total-savings`: The total resources freed per period by eliminating all candidates

## Process

1. For each candidate, determine the termination method: cancel the subscription, close the project, end the contract, sell the investment, decline the recurring meeting.
2. Calculate the exit cost: early termination fees, cleanup work, transition costs. If the exit cost exceeds the savings for the remaining contract term, it may be cheaper to let the commitment expire naturally.
3. Execute the terminations in order of savings: the highest-savings candidates first. Each termination frees resources for higher-value uses.
4. Record the total savings per period. This is the budget freed for reallocation to higher-value commitments.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
