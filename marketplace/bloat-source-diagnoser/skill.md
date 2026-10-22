# Bloat Source Diagnoser

For each bloated category, diagnose why actual spending exceeds the justified amount: is it lifestyle creep, price increases, frequency increases, or scope expansion?

## Inputs

- `bloat-table`: Categories with their bloat gaps
- `actual-spending`: The underlying transaction detail

## Outputs

- `bloat-diagnoses`: For each top-3 bloated category: the specific cause of the bloat and the transactions driving it
- `reversibility-assessment`: For each bloated category: how easy is it to reduce spending to the justified level (easy, medium, hard) and what specifically would have to change

## Process

1. For each bloated category, pull the individual transactions. Compare the oldest month to the newest month. Look for: new payees (scope expansion), the same payees at higher amounts (price increases), the same payees more frequently (frequency creep), or upgraded versions of the same thing (lifestyle creep).
2. Identify the specific transactions causing the majority of the gap. Usually 2 to 4 transactions explain 80% of the bloat in a category.
3. Assess reversibility: can you cancel the new additions (easy), renegotiate the prices (medium), or would you have to fundamentally change a habit or commitment (hard)?
4. For hard-to-reverse bloat, check whether the bloated spending is actually producing value that the original zero-based justification missed. If so, update the justified amount. Not all bloat is waste; some is an honest re-evaluation of need.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
