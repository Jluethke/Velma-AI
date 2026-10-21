# Soar Workflow Designer

Design the automated workflow including enrichment, decision logic, and response actions.

## Inputs

- `selected-use-case`: Use case to automate
- `manual-workflow-doc`: Current manual investigation steps

## Outputs

- `workflow-design`: Automated workflow diagram with enrichment, decision, and action steps
- `integration-requirements`: APIs and tools the playbook needs to connect to

## Process

1. Map each manual step to an automated equivalent (API call, lookup, comparison)
2. Define decision points: what conditions trigger automated containment vs analyst review
3. Identify all tool integrations needed (SIEM, EDR, firewall, ticketing, email)
4. Design the notification and escalation paths for cases requiring human judgment

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
