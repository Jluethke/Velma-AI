# Job Statement Synthesizer

Synthesize the interviews into job statements. A job statement follows a specific format: when [situation], I want to [motivation], so I can [desired outcome].

## Inputs

- `interview-transcripts`: Full interview notes
- `raw-forces-data`: Push, pull, anxiety, and habit for each interview

## Outputs

- `job-statements`: The 2-5 distinct jobs uncovered, each in the format: when [situation], I want to [motivation], so I can [desired outcome]
- `forces-diagram`: For each job: the four forces mapped with specific examples from the interviews

## Process

1. Group the interviews by similarity: which interviews describe the same situation and the same desired outcome? Each group is a candidate job.
2. For each group, write the job statement: 'When [the common situation], I want to [the common motivation], so I can [the common desired outcome].'
3. Test each job statement: does it explain why the person switched? Does it explain what they were switching from? Does it explain the alternatives they considered? A good job statement passes all three tests.
4. Map the four forces for each job: the push (dissatisfaction with the old way), the pull (attraction to the new way), the anxiety (risk of switching), and the habit (comfort of the old way). The balance of these forces determines whether someone switches.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
