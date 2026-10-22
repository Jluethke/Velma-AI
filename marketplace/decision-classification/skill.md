# Decision Classification

Classify each decision on two axes: importance (high vs low impact on outcomes) and reversibility (easy to undo vs hard to undo).

## Inputs

- `decision-log`: All decisions from the logged day
- `decision-count`: Total count

## Outputs

- `classified-decisions`: Each decision placed in one of four quadrants: high-importance/irreversible (deliberate), high-importance/reversible (decide fast then adjust), low-importance/irreversible (standardize), low-importance/reversible (eliminate or automate)
- `quadrant-counts`: How many decisions fell in each quadrant

## Process

1. For each decision, rate importance: if you chose poorly, how much would it matter in a week? In a month? If the answer is 'not at all,' it is low importance.
2. For each decision, rate reversibility: if you chose poorly, how hard would it be to change course? Choosing what to eat for lunch is highly reversible. Choosing which vendor to sign a 2-year contract with is not.
3. Place each decision in the 2x2 matrix. Most decisions (typically 60-80%) are low-importance and reversible. These are the candidates for elimination.
4. The insight: you are spending cognitive energy on dozens of decisions that do not matter and could easily be changed even if you chose wrong. That energy should go to the few decisions in the high-importance quadrants.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
