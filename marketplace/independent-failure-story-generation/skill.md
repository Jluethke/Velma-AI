# Independent Failure Story Generation

Generate independent failure stories. Each participant (or each pass, if solo) writes the story of how the plan failed without seeing anyone else's story. The key discipline is independence: shared stories converge on the obvious risks and miss the non-obvious ones.

## Inputs

- `framed-plan`: The one-sentence plan with success and failure definitions
- `failure-definition`: What failure looks like at the time horizon

## Outputs

- `failure-stories`: Collection of independent failure narratives, each telling the story of how and why the plan failed
- `story-count`: Number of independent stories generated

## Process

1. Set the prompt: 'It is [time horizon]. The plan failed. Write the story of how it happened.'
2. Each participant writes independently. No discussion, no sharing, no peeking.
3. If solo, write at least 5 stories from different angles: technical failure, people failure, market failure, timing failure, resource failure.
4. Each story must name a specific cause, not a vague category. 'The lead engineer quit in month 3' not 'we had staffing issues'.
5. Collect all stories without editing or filtering.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
