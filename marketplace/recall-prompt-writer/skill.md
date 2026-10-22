# Recall Prompt Writer

Turn each item into a question-and-answer prompt that forces active recall.

## Inputs

- `atomic-items`: The smallest facts that stand on their own
- `priority-tags`: A priority and topic tag for each item

## Outputs

- `recall-prompts`: Questions that force recall of one fact each
- `answer-keys`: The single clear answer for each prompt

## Process

1. Write each item as a question with a single, clear answer.
2. Keep each prompt focused on one fact to avoid interference.
3. Add a cue or context where the bare question is ambiguous.
4. Rewrite any prompt that could be answered without real recall.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
