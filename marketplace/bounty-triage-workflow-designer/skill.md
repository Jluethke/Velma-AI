# Bounty Triage Workflow Designer

Design the submission intake and triage workflow from report to resolution.

## Inputs

- `response-sla-matrix`: SLA targets by severity
- `platform-configuration`: Platform configuration

## Outputs

- `triage-workflow`: Step-by-step triage workflow with decision points
- `ticketing-integration-spec`: Specification for integrating with internal ticketing systems

## Process

1. Map the workflow from report submission through triage, validation, fix, retest, and payment
2. Define decision points: is it a duplicate, is it in scope, can it be reproduced, what severity
3. Specify the ticketing integration so validated reports create internal bugs automatically
4. Build the feedback loop where researchers are notified at each state change

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
