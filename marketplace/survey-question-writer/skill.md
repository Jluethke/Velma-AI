# Survey Question Writer

Write the survey questions, avoiding common pitfalls like leading, double-barreled, and ambiguous items.

## Inputs

- `research-question`: The question the survey will answer
- `survey-method`: The selected survey method

## Outputs

- `question-list`: The ordered list of survey questions with response types
- `skip-logic-rules`: Conditional logic rules for question routing

## Process

1. Draft questions that directly address the research question, one concept per question.
2. Select the response format for each question (Likert scale, multiple choice, open text, ranking).
3. Review each question for leading language, double-barreled phrasing, and ambiguity.
4. Define skip logic rules so respondents only see questions relevant to their prior answers.
5. Order questions from general to specific, placing demographic questions at the end.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
