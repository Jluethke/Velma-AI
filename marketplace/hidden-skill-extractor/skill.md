# Hidden Skill Extractor

Extract the skills each top performer uses daily that were never in the job description. These are the hidden requirements. Ask: 'What skill do you use every day that was not mentioned when you were hired?' and 'What would someone need to learn on day one that nobody told them about?'

## Inputs

- `first-90-days-data`: What each performer did early on
- `common-early-actions`: Shared early actions across performers

## Outputs

- `hidden-skills-inventory`: Skills used daily by top performers that do not appear in the job description, with frequency count across the 5
- `job-description-gaps`: The gap between what the job description says and what the role actually requires

## Process

1. In the same interview (or a follow-up), ask each performer: What skill do you use every day that was not mentioned when you were hired?
2. Follow up: If you had to train your replacement in one week, what would you spend the most time on? The answer is usually the hidden skill.
3. Compare the hidden skills list against the current job description. List every skill that appears in the interviews but not in the job description.
4. Rank hidden skills by how many of the 5 performers mentioned them.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
