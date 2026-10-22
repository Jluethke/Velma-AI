# Channel Mapping Configuration

Map each alert category to its delivery channels and recipients.

## Inputs

- `alert-categories`: Defined alert categories and severity levels
- `severity-matrix`: Matrix of alert types to severity

## Outputs

- `channel-map`: Mapping of each category to delivery channels (SMS, email, push, Slack, PagerDuty, phone call)
- `recipient-roster`: List of recipients for each channel and category

## Process

1. For each severity level, select the appropriate channels (critical: phone + SMS + PagerDuty; warning: Slack + email; informational: email or dashboard only).
2. Assign recipients to each channel based on team structure and on-call rotation.
3. Document the channel map with fallback channels if the primary is unreachable.
4. Verify that every alert category has at least one channel and one recipient.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
