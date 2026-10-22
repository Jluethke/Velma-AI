# Escalation Router

Route escalated tickets to the appropriate tier with a briefing.

## Inputs

- `escalation-candidates`: Tickets flagged for escalation
- `trigger-reasons`: Reasons for each escalation

## Outputs

- `escalated-tickets`: Tickets assigned to higher-tier agents
- `escalation-briefs`: Context briefs for receiving agents

## Process

1. Determine the target tier based on escalation type.
2. Compile the ticket history into a brief for the receiving agent.
3. Assign the ticket to the target tier queue.
4. Notify the receiving agent with the brief.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
