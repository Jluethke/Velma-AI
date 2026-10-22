# Decision Entry Recorder

Record a decision journal entry at the moment of the decision. The entry must be written before the outcome is known. Capture the reasoning as it exists right now, not as you will reconstruct it after the fact. The most important field is the confidence level, because that is what you will calibrate against.

## Inputs

- `decision-made`: The decision you just made or are about to make
- `journal-template`: The journal entry template

## Outputs

- `journal-entry`: The completed journal entry with all fields filled in before the outcome is known
- `outcome-check-date`: When to check the outcome against the prediction

## Process

1. Fill in every field in the template. Do not skip the information gap field; it is the hardest to fill in but the most useful.
2. Set the confidence level as a percentage. If you cannot assign a number, use the scale: 55% (barely more likely than a coin flip), 70% (I would bet on it), 85% (I would be surprised if wrong), 95% (nearly certain).
3. State the expected outcome in terms that can be checked: a number, a date, a yes/no condition. Not 'it will go well' but 'revenue will exceed $X by date Y'.
4. Set the outcome check date. This is the date when you will compare your prediction to reality.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
