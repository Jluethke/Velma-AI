# Overhead And Switching Cost Adder

Add the overhead allocation (shared costs that exist because of this subject) and the switching cost (what it would cost to stop).

## Inputs

- `analysis-subject`: The subject being analyzed
- `direct-costs`: Direct costs
- `time-cost`: Time costs

## Outputs

- `overhead-allocation`: The share of overhead costs attributable to this subject: storage space, tools, platforms, or team time that wouldn't exist without it
- `switching-cost`: The one-time cost to stop: cancellation fees, migration effort, retraining, or lost sunk investment

## Process

1. Identify overhead costs that exist partly because of this subject. A business might maintain a warehouse partly for this product line. A person might pay for a larger apartment partly for a home gym. Allocate the portion attributable to this subject.
2. The test for overhead allocation: if you eliminated this subject entirely, would this overhead cost decrease? If yes, allocate the decrease. If the overhead would stay the same regardless, the allocation is zero.
3. Calculate the switching cost: what would you have to spend to stop? Early termination fees, data migration, replacement purchase, retraining time, or lost deposits. Amortize one-time switching costs over the expected remaining usage period.
4. If the switching cost is very high relative to the ongoing cost, this subject has lock-in. High lock-in means the true cost includes the inability to leave, which should be weighted in the final assessment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
