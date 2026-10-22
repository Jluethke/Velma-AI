# One Way Door Deep Analyzer

For one-way door decisions, run the deep process: gather multiple perspectives, identify what information would change your mind, and test your reasoning against someone who disagrees. One-way doors deserve 10x the effort of a two-way door because the cost of being wrong is permanent.

## Inputs

- `classified-decisions`: Decisions classified by door type

## Outputs

- `one-way-analysis`: For each one-way door: the perspectives gathered, the crux (the single disagreement that matters most), and the decision with reasoning
- `missing-information`: Information that would change the decision if available, and whether it can be obtained before the deadline

## Process

1. For each one-way door, gather at least 3 perspectives from people with different incentives or experiences.
2. Identify the crux: the single factual disagreement that, if resolved, would make the decision obvious.
3. Ask: what information, if I had it, would change my mind? Can I get that information before I have to decide?
4. If the information is obtainable, get it. If not, decide with what you have and document your uncertainty.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
