# Review Card Creation

Create review cards (questions and answers) for each knowledge item, using the minimum information principle: one item per card.

## Inputs

- `knowledge-items`: Discrete testable items
- `item-format-map`: The test format for each item

## Outputs

- `review-cards`: A set of cards, each with a prompt (question) and a response (answer), one item per card
- `card-count`: Total number of cards created

## Process

1. Write one card per knowledge item. The prompt should trigger recall of exactly one piece of knowledge. If you need two pieces of knowledge to answer, split it into two cards.
2. Make prompts specific and unambiguous. 'What is the half-life of caffeine?' is better than 'Tell me about caffeine.'
3. For application items, write the prompt as a scenario: 'A patient presents with X, Y, Z. What is the next diagnostic step?'
4. Include a brief source reference on each card so you can look up the context if the answer surprises you during review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
