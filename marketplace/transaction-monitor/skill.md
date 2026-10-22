# Transaction Monitor

Monitor transactions against the detection rules and flag suspicious activity.

## Inputs

- `detection-rules`: Active fraud detection rules
- `monitoring-scope`: Channels and types being monitored

## Outputs

- `flagged-transactions`: Transactions that triggered one or more rules
- `alert-queue`: Prioritized queue of alerts for investigation

## Process

1. Score each transaction against the active rules.
2. Flag transactions that exceed the thresholds.
3. Prioritize the alert queue by risk score and dollar amount.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
