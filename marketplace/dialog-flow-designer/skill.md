# Dialog Flow Designer

Map the user intents and design the dialog flows for each conversation type.

## Inputs

- `bot-persona`: Bot persona document
- `target-audience`: Target audience description

## Outputs

- `dialog-flows`: Dialog flow diagrams for each conversation type with branching logic
- `intent-map`: Map of user intents to dialog flows with example utterances

## Process

1. List the conversation types the agent will handle.
2. For each type, map the dialog from trigger to resolution including branches.
3. Define the intents and slot-filling requirements at each turn.
4. Identify the decision points where the flow branches based on user input.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
