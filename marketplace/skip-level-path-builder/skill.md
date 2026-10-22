# Skip Level Path Builder

Build a skip-level escalation path for genuine emergencies that bypasses the normal chain. When the building is on fire, you do not file a ticket.

## Inputs

- `receiver-map`: The normal escalation receivers
- `trigger-catalog`: Including the most severe triggers

## Outputs

- `skip-level-criteria`: Specific conditions under which the normal path is bypassed
- `skip-level-path`: Who to contact directly and how, with alternate contact methods

## Process

1. Define the criteria for skip-level: multiple systems down, safety risk, legal or regulatory deadline within hours, revenue impact above a threshold.
2. Name the person who receives skip-level escalations. This is usually the executive on call or the incident commander.
3. Provide at least 3 contact methods: phone (not voicemail), text, and a secondary channel (Slack DM, Teams, personal email).
4. Make the criteria unambiguous so the person escalating does not have to make a judgment call under pressure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
