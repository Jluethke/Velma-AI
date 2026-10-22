# Scoring Rubric Builder

Build the scoring rubric before any candidate attempts the task. This prevents the rubric from being reverse-engineered from the first submission. Define 4-6 scoring dimensions, each with a 1-5 scale and concrete anchors for each level. Weight the dimensions by importance to the role.

## Inputs

- `work-sample-brief`: The task brief candidates will receive
- `impact-ranking`: Which aspects of performance matter most in this role

## Outputs

- `scoring-rubric`: The complete rubric with dimensions, scales, anchors, and weights
- `scorer-instructions`: Instructions for the person scoring the work samples, including how to handle edge cases

## Process

1. Identify 4-6 dimensions that distinguish good work from mediocre work on this task. Common dimensions: accuracy, thoroughness, communication clarity, efficiency, and judgment under ambiguity.
2. For each dimension, write concrete anchors for levels 1, 3, and 5. Level 1 is unacceptable. Level 3 is competent. Level 5 is exceptional. Levels 2 and 4 are interpolations.
3. Weight each dimension. If accuracy is twice as important as communication clarity, give it double the weight.
4. Write scorer instructions that specify: score each dimension independently, do not let a strong impression on one dimension inflate others (halo effect), and record a brief justification for each score.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
