# Dispute Execution Manager

Execute the selected resolution process.

## Inputs

- `selected-path`: The resolution path to execute
- `resolution-strategy`: Strategy and settlement authority

## Outputs

- `process-log`: Log of actions taken during the resolution process
- `preliminary-outcome`: Preliminary outcome or status of the process

## Process

1. For negotiation: draft the demand or response, conduct rounds, log positions and counteroffers.
2. For mediation: select the mediator, prepare the mediation brief, attend the session.
3. For arbitration: file the demand, conduct discovery, prepare for hearing, attend.
4. For litigation: file the complaint or answer, conduct discovery, prepare for trial.
5. Track all actions and costs in the process log.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
