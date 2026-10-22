# Forward Value Assessor

For each commitment, assess the forward-looking value. Ignore what you have already spent. Ask only: knowing what I know now, would I start this commitment today?

## Inputs

- `commitment-list`: The inventory of ongoing commitments
- `scope`: The context for value assessment

## Outputs

- `value-assessments`: Each commitment rated: keep (value exceeds cost), review (value is marginal), or eliminate (cost exceeds value)
- `elimination-candidates`: Commitments where the forward-looking cost exceeds the forward-looking value

## Process

1. For each commitment, answer: if I were not already in this commitment, would I start it today at the current cost? If the answer is no, it is an elimination candidate.
2. Estimate the forward-looking value: what will this commitment produce in the next 12 months? Be specific. If you cannot name the value, the value is probably zero.
3. Estimate the forward-looking cost: what will it cost in the next 12 months, including the opportunity cost of the money, time, or attention consumed?
4. Do not consider the sunk cost. 'We have already invested $50,000 in this project' is irrelevant. The $50,000 is gone regardless of whether you continue. The only question is whether the next dollar is worth it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
