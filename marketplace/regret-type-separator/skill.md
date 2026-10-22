# Regret Type Separator

Separate regret of action from regret of inaction. Research by Gilovich and Medvec shows that in the short term, people regret actions more (embarrassment, loss, pain). But in the long term, people overwhelmingly regret inactions (the business they did not start, the person they did not ask out, the move they did not make). Weight your analysis accordingly.

## Inputs

- `action-best-case`: Best case of taking action
- `action-worst-case`: Worst case of taking action
- `inaction-story`: Story of not taking action

## Outputs

- `action-regret-estimate`: How much you would regret trying and failing, on a scale of 1 to 10, with the specific source of regret named
- `inaction-regret-estimate`: How much you would regret never trying, on a scale of 1 to 10, with the specific source of regret named

## Process

1. Read the action worst-case story. If this happened, how much would you regret having tried? Score 1 to 10.
2. Name the specific source of that regret: money lost, time wasted, embarrassment, opportunity cost.
3. Read the inaction story. If this is your life, how much would you regret never having tried? Score 1 to 10.
4. Name the specific source of that regret: the wondering, the what-if, the path not taken.
5. Compare the two scores. Research shows inaction regret averages 2 to 3 points higher than action regret across studies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
