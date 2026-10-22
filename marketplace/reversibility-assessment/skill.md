# Reversibility Assessment

For each decision, assess its reversibility. Ask three questions: (1) If I choose wrong, can I undo it? (2) What would undoing it cost in money, time, and relationships? (3) How long do I have before the choice becomes irreversible? Classify as one-way door, two-way door, or sliding door (currently two-way but becoming one-way as a deadline approaches).

## Inputs

- `decision-inventory`: The list of pending decisions

## Outputs

- `classified-decisions`: Each decision classified as one-way door, two-way door, or sliding door with the reasoning
- `sliding-door-deadlines`: For sliding doors: when the two-way door becomes one-way

## Process

1. For each decision, ask: if I get this wrong, can I reverse it within 30 days at reasonable cost?
2. If yes: two-way door. If no: one-way door. If 'yes but only for a limited time': sliding door.
3. For one-way doors, estimate the reversal cost if it were even possible (to confirm the classification).
4. For sliding doors, identify the exact date or event after which the decision becomes irreversible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
