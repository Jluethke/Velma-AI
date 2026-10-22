# Job Statement Synthesis

Synthesize the interviews into 1-3 job statements: the progress the customer was trying to make, stated in their language.

## Inputs

- `four-forces-map`: Forces for each customer
- `force-patterns`: Patterns across customers

## Outputs

- `job-statements`: 1-3 job statements in the format: 'When [situation], I want to [progress], so I can [outcome]'
- `job-priorities`: Which job is most common, most urgent, and most underserved

## Process

1. Look across all interviews for the common push and pull. The job is the progress that most customers share, stated as: 'When [situation], I want to [progress], so I can [outcome].'
2. If there are multiple distinct jobs (different segments hire the product for different reasons), state each separately. Typically there are 1-3 core jobs.
3. Prioritize the jobs by: frequency (how many customers have this job), urgency (how strongly the push is felt), and underserved-ness (how poorly current solutions do the job).
4. The job statements are not feature requirements. They are the lens through which all feature decisions should be made: 'Does this feature help the customer make the progress they hired us for?'

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
