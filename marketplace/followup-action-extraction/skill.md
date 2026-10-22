# Followup Action Extraction

Define how to extract the one concrete action from an interaction, because most interactions generate a vague sense of I should follow up rather than a specific doable task, and a follow-up that is not a concrete action never gets done.

## Inputs

- `capture-protocol`: The protocol for capturing follow-ups after interactions
- `capture-window-rules`: The 24 hour capture window and its trigger

## Outputs

- `action-extraction-rules`: Rules for turning what happened in an interaction into one specific, doable follow-up action
- `action-quality-criteria`: The test for whether a captured follow-up is concrete enough to act on without further thinking

## Process

1. Extract one action, not a list. A single clear follow-up that actually happens beats five good intentions that do not. If an interaction genuinely generated several, pick the one that matters most and let the rest go.
2. Make the action concrete and self-contained. Not follow up with Sarah but send Sarah the article on route planning we discussed. The captured task should require no further thinking to execute.
3. Capture the context the action needs alongside it: what was discussed, what you promised, and any detail you will need, so that future-you can act without reconstructing the conversation.
4. Apply a quality test to each captured action: could you do this right now from the capture alone, without remembering anything extra? If not, it is too vague, and you sharpen it while the interaction is still fresh.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
