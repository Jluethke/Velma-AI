# Screening Signal Translator

Turn each evidence-based requirement into a screening signal you can observe in an application or a short conversation, so the pattern actually filters candidates instead of sitting in a document.

## Inputs

- `evidence-based-requirements`: The rewritten requirements
- `removed-requirements`: The requirements that were cut

## Outputs

- `screening-questions`: A question or application signal for each requirement that strong candidates answer differently from weak ones
- `signal-scoring-key`: What a strong, average, and weak answer looks like for each question

## Process

1. For each requirement, write a screening question or application signal that a strong candidate answers differently from a weak one.
2. Replace vague prompts such as whether someone is a self-starter with behavioral prompts asking for a specific time they did something unasked.
3. Build a scoring key describing a strong, average, and weak answer for each question.
4. Test the questions on your known top performers; if they do not score high, the question is measuring the wrong thing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
