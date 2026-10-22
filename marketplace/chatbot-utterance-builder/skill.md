# Chatbot Utterance Builder

Build training utterances and test the chatbot conversations.

## Inputs

- `conversation-flows`: Scripted conversation flows
- `fallback-paths`: Fallback and handoff paths

## Outputs

- `training-set`: Training utterances for each intent
- `test-results`: Results from sample conversation tests

## Process

1. Generate training utterances with variations for each intent.
2. Run sample conversations through each flow.
3. Measure intent recognition accuracy and flow completion rate.
4. Identify and fix misrouted or dead-end paths.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
