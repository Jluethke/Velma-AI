# Offer Sequencing

Sequence the concrete offers, such as a free assessment, a custom plan, a pilot, and the full purchase, and define what moves a buyer up.

## Inputs

- `micro-asks`: The bridging small asks
- `yes-ladder`: The full ladder of asks

## Outputs

- `sequenced-offers`: The ordered offers mapped onto the yes ladder
- `transition-triggers`: The signal that tells you a buyer is ready for the next offer

## Process

1. Place a real offer on each rung, starting with something free that still delivers value.
2. Make each offer a natural setup for the next, so the pilot presumes the plan and the plan presumes the assessment.
3. Define the trigger that means a buyer is ready to move up, such as using the assessment or hitting a result.
4. Write what happens when a buyer stalls on a rung, since a stall is a signal, not a failure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
