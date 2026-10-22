# Decision Maker Identification

For each loss, separate the contact you worked from the person who actually made the no decision.

## Inputs

- `stage-tagged-losses`: Losses tagged by stage

## Outputs

- `decision-map`: Per-deal map of who decided versus who you were talking to
- `authority-gaps`: Deals where you never reached the real decision maker

## Process

1. For each loss, name the person who gave the final no and the person you spent the most time with.
2. Mark deals where those two were different people, which signals you were selling to the wrong level.
3. Collect the deals where the real decision maker was never engaged into an authority-gap list.
4. Note whether authority gaps cluster in a segment, deal size, or stage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
