# Weekly Risk Scan

Run a weekly scan for new risks based on what happened since the last scan.

## Inputs

- `current-risk-register`: The existing list of identified project risks
- `weekly-events`: What happened in the past week: deliverables completed or missed, decisions made, dependencies changed, new information received

## Outputs

- `new-risks-identified`: Risks surfaced by the week's events that were not in the previous register
- `changed-risks`: Existing risks whose probability or impact changed based on the week's events

## Process

1. Review the week's events: what was delivered, what was missed, what dependencies shifted, what new information emerged, what decisions were made.
2. For each event, ask: does this create a new risk? Does this change the probability or impact of an existing risk? Does this eliminate an existing risk?
3. Add new risks to the register with their probability, impact, and the event that surfaced them.
4. Update changed risks: re-rate their probability and impact based on the new information.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
