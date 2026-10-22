# Escalation Policy Builder

Configure escalation policies defining who gets alerted, when, and how alerts escalate through the chain.

## Inputs

- `rotation-schedule`: The on-call rotation calendar
- `severity-definitions`: Definitions of alert severity levels

## Outputs

- `escalation-policies`: The configured escalation chains per severity
- `response-sla-targets`: Expected response times per severity level

## Process

1. Define severity levels and their response time expectations
2. Map each severity to an escalation chain
3. Set timeout intervals for each escalation step
4. Define the final escalation destination for unacknowledged alerts

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
