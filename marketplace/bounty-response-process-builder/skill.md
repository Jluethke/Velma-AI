# Bounty Response Process Builder

Build the internal security response process for handling incoming reports.

## Inputs

- `severity-tiers`: Severity classification scheme
- `platform-selection`: Selected platform

## Outputs

- `response-sla-matrix`: SLA targets for triage, validation, fix, and payment by severity
- `escalation-procedures`: Escalation paths for critical findings and disputes

## Process

1. Define SLA targets: time to first response, time to triage, time to fix, time to payment
2. Assign roles: who triages, who validates, who approves payment, who communicates with researchers
3. Build escalation procedures for critical severity and for researcher disputes
4. Create templates for common responses (duplicate, out of scope, accepted, needs info)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
