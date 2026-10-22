# Evidence Collection And Update

Collect the evidence and update the probability. For each piece of evidence, apply the update rule you defined in advance. Resist the urge to change the update rule after seeing the evidence. If the evidence is surprising, that is informative; do not discount it because it was unexpected.

## Inputs

- `evidence-plan`: The pre-defined evidence and update rules
- `stated-prior`: The starting probability

## Outputs

- `updated-probability`: The probability after incorporating all available evidence, with the update chain showing each step
- `evidence-log`: Each piece of evidence, the pre-defined update rule, and the resulting probability after that update

## Process

1. Collect the first piece of evidence. Apply the update rule you defined in advance.
2. Record the new probability. This becomes the prior for the next update.
3. Repeat for each piece of evidence. The order should not matter much if the evidence is independent.
4. If you feel the urge to change an update rule after seeing the evidence, note that urge but apply the original rule. The urge to adjust is often motivated reasoning.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
