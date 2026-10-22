# Question Sequence Design

Design a sequence of questions that guides the person from their current belief to the conclusion you want them to reach on their own.

## Inputs

- `belief-map`: Their current position
- `belief-gap`: The gap to bridge

## Outputs

- `question-sequence`: 4-6 questions, each building on the previous answer, guiding toward the conclusion
- `anticipated-answers`: Expected answers and follow-up questions

## Process

1. Start with a question they will answer in a way that reveals a gap: 'What metrics are we using to measure whether the current approach is working?'
2. Each subsequent question builds on the previous answer and moves closer to the conclusion.
3. Never state the conclusion yourself. The final question should lead them to state it.
4. If they resist, ask: 'What am I missing?' Their answer reveals the real objection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
