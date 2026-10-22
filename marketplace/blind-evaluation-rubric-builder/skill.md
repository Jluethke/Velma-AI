# Blind Evaluation Rubric Builder

Build the scoring rubric before any candidate submits, so it cannot be reverse-engineered from the first submission. Define four to six dimensions, each on a one to five scale with concrete anchors, weighted by importance to the role.

## Inputs

- `compensation-terms`: The payment terms for the sample
- `candidate-instructions`: The candidate-facing package

## Outputs

- `scoring-rubric`: Four to six weighted dimensions, each with concrete anchors at levels one, three, and five
- `scorer-guide`: Instructions for scorers: rate each dimension independently and record a one-line reason for every score

## Process

1. Choose four to six dimensions that separate strong work from mediocre work on this task, such as accuracy, thoroughness, clarity, and judgment under ambiguity.
2. For each dimension, write concrete anchors for levels one, three, and five. Level one is unacceptable, level three is competent, level five is exceptional.
3. Weight the dimensions. If accuracy matters twice as much as formatting, give it double weight.
4. Write the scorer guide: score each dimension on its own, do not let one strong dimension inflate the others, and record a one-line reason for each score.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
