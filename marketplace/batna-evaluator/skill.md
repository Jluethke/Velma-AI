# Batna Evaluator

Evaluate alternatives and identify the best one. This is your BATNA. It sets your reservation price.

## Inputs

- `alternatives-list`: The alternatives with their outcomes
- `alternative-costs`: The costs of each alternative

## Outputs

- `batna`: The best alternative: the specific action you will take if negotiation fails, with its expected outcome
- `reservation-price`: The worst deal you should accept: any deal must be better than the BATNA, or you walk away

## Process

1. Rank alternatives by net value: outcome minus cost. The highest net value alternative is your BATNA.
2. Set the reservation price: the deal terms that make you indifferent between the deal and the BATNA. Any deal worse than this, you walk away.
3. Test the reservation price: would you genuinely walk away at this point? If not, you have overestimated your BATNA.
4. Write down the BATNA and reservation price before entering the negotiation. Negotiation pressure will tempt you to accept worse deals unless the walk-away point is pre-committed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
