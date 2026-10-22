# Escalation Handoff Designer

Design the escalation and handoff logic for transferring to a human agent.

## Inputs

- `prompt-library`: All prompts and responses
- `voice-constraints`: Agent behavior constraints

## Outputs

- `escalation-rules`: Rules for when to escalate (repeated failures, user request, sensitive topic, high-value account)
- `handoff-protocol`: How the handoff works: context passed to human, warm vs cold transfer, queue routing
- `voice-agent-design-document`: Complete voice agent design document

## Process

1. Define the automatic escalation triggers (3 consecutive misunderstandings, explicit request, sensitive topic detection).
2. Design the warm transfer flow (agent summarizes the conversation to the human before handing off).
3. Design the cold transfer flow (agent places the caller in queue with context attached).
4. Set the routing rules (which queue or skill group receives which type of escalation).
5. Compile the full voice agent design document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
