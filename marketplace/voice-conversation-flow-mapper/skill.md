# Voice Conversation Flow Mapper

Map the conversation flows for each use case, including intents, entities, and dialog turns.

## Inputs

- `use-case-catalog`: Prioritized list of use cases
- `user-personas`: Target user personas

## Outputs

- `conversation-flows`: Dialog flow diagrams for each use case with intents, entities, and branching logic
- `intent-entity-schema`: Catalog of intents and entities with example utterances

## Process

1. For each use case, map the happy path dialog from greeting to resolution.
2. Identify the intents (what the user wants) and entities (the data they provide) at each turn.
3. Add branching paths for ambiguous input, missing information, and confirmation steps.
4. Write 5 to 10 example utterances per intent to cover phrasing variation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
