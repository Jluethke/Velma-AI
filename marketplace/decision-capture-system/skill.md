# Decision Capture System

Build the decision capture system. For each important decision, record: the question, the options considered, the chosen option, the reasoning (specific, not vague), the expected outcome, and the review date. The reasoning field is the most valuable because it is what everyone forgets.

## Inputs

- `documented-knowledge-inventory`: Inventory of existing documentation
- `decision-coverage-gap`: Which decisions lack recorded reasoning

## Outputs

- `decision-log-template`: Template for recording decisions with required fields: question, options, choice, reasoning, expected outcome, review date
- `decision-capture-trigger-list`: List of situations that should trigger a decision log entry (budget over X, policy change, architecture choice, hiring criteria change)

## Process

1. Design the decision record template with six fields: the question (what are we deciding?), the options (what did we consider?), the choice (what did we pick?), the reasoning (why this one and not the others?), the expected outcome (what do we expect to happen?), and the review date (when should we check if this decision was right?).
2. The reasoning field requires specificity. 'It seemed like the best option' is not reasoning. 'Option B had a 3-week lead time that would miss the deadline, and Option C required a skill set we do not have on the team' is reasoning.
3. Define the trigger list: any decision that affects budget over a threshold, changes a policy, alters system architecture, sets a hiring bar, or creates a precedent must be logged.
4. Retroactively capture the top 20 decisions from the audit. Interview the people who made them and record the reasoning before it is forgotten.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
