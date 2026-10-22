# Dialog Flow Architect

Design the conversation flows including intents, slots, and branching logic.

## Inputs

- `voice-persona`: The agent persona definition
- `voice-constraints`: Constraints on agent behavior

## Outputs

- `dialog-flows`: Mapped conversation flows with intents, slots, confirmations, and branches
- `intent-catalog`: Complete list of intents the agent recognizes with example utterances

## Process

1. List every task the agent should handle (each becomes a primary intent).
2. For each intent, define the required slots (information the agent needs to collect).
3. Map the happy path for each intent from greeting through task completion.
4. Map the error paths: slot not understood, intent not recognized, user frustration, silence.
5. Design the confirmation and disambiguation prompts.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
