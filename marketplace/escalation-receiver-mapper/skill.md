# Escalation Receiver Mapper

Map who receives each escalation level. The receiver must have the authority to act on the escalation. A receiver without authority is a relay, not a resolution.

## Inputs

- `severity-levels`: The defined severity tiers
- `system-or-org-description`: The organizational structure

## Outputs

- `receiver-map`: For each severity level: primary receiver, backup receiver, and what authority they have to act
- `authority-gaps`: Places where the receiver does not have authority to resolve the issue and needs to escalate further

## Process

1. For each severity level, name the specific person (not a role, a person) who receives the escalation during business hours and after hours.
2. For each receiver, state their authority: can they spend money, reassign people, shut down a system, communicate to customers, or only relay upward?
3. Name the backup for each receiver. If the primary is unavailable, the backup must have the same authority.
4. Identify authority gaps: where does the receiver need to escalate further to get resolution? These gaps add delay. Minimize them for Level 1.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
