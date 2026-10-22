# Verification Trigger System

Set up periodic and event-based triggers that prompt data verification before the data goes stale enough to cause problems.

## Inputs

- `decay-model`: Per-field half-lives
- `staleness-flags`: Currently stale fields

## Outputs

- `verification-schedule`: The periodic verification cadence per field type and relationship tier
- `event-triggers`: Events that should trigger immediate verification (bounced email, changed LinkedIn profile, company acquisition, re-engagement after dormancy)

## Process

1. Set the periodic schedule: verify each field at 75% of its half-life. Job titles get checked every 13 months. Emails every 10 months. Phone numbers every 22 months. Batch the verifications into a monthly process where you check all fields due that month.
2. Define event triggers that override the periodic schedule. Bounced email = immediate email verification. LinkedIn profile change notification = immediate title and company verification. Company acquisition announcement = verify all contacts at that company. Re-engagement after dormancy = verify all fields (a lot may have changed while they were quiet).
3. Design the verification methods by field. Email: send a message and see if it bounces. Phone: call or text. Job title and company: check LinkedIn or company directory. Address: verify next time you send physical mail. Social profiles: visit the profile. Minimize verification that feels like surveillance; use natural touchpoints where possible.
4. Build the verification queue: a prioritized list of contacts and fields to verify, sorted by staleness relative to half-life and relationship importance. Process the queue weekly as part of your relationship maintenance routine, not as a separate task.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
