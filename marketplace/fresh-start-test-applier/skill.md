# Fresh Start Test Applier

Apply the fresh-start test to each commitment: 'If I were starting from zero today, knowing what I know now but having invested nothing, would I choose this?' If the answer is no, the commitment is held by sunk costs. If the answer is 'only partially', the commitment needs restructuring.

## Inputs

- `commitment-inventory`: All active commitments with costs

## Outputs

- `fresh-start-results`: For each commitment: whether it passes the fresh-start test (yes, no, partially)
- `sunk-cost-suspects`: Commitments that failed the fresh-start test

## Process

1. For each commitment, imagine you have zero history with it. You just learned it exists. Would you sign up today at the current ongoing cost?
2. If yes: the commitment stands on its current merits. Keep it.
3. If no: you are held by sunk costs (money already spent, time already invested, identity attached to it). Flag it.
4. If partially: the commitment has some value but not enough to justify its current cost. Flag it for restructuring.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
